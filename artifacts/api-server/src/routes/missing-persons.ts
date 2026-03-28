import { Router, type IRouter } from "express";
import { db, missingPersonsTable, alertsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  CreateMissingPersonBody,
  UpdateMissingPersonBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `TFN-${year}-${rand}`;
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < Math.min(str.length, 4096); i++) {
    hash = Math.imul((hash << 5) + hash, 1) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function generateDeterministicEmbedding(source: string): string {
  const dims = 128;
  const rng = seededRng(hashString(source));
  const raw = Array.from({ length: dims }, () => rng() * 2 - 1);
  const norm = Math.sqrt(raw.reduce((s, v) => s + v * v, 0));
  return JSON.stringify(raw.map((v) => v / norm));
}

function generateFakeEmbedding(photoUrl?: string | null): string {
  if (photoUrl) return generateDeterministicEmbedding(photoUrl);
  const dims = 128;
  const raw = Array.from({ length: dims }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(raw.reduce((s, v) => s + v * v, 0));
  return JSON.stringify(raw.map((v) => v / norm));
}

router.get("/", async (req, res) => {
  try {
    const { status, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = parseInt(limit, 10);
    const off = parseInt(offset, 10);

    let query = db.select().from(missingPersonsTable).orderBy(desc(missingPersonsTable.createdAt));

    const all = await db.select().from(missingPersonsTable).orderBy(desc(missingPersonsTable.createdAt));
    const filtered = status ? all.filter((p) => p.status === status) : all;
    const paginated = filtered.slice(off, off + lim);

    res.json({
      data: paginated.map(formatPerson),
      total: filtered.length,
      limit: lim,
      offset: off,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list missing persons");
    res.status(500).json({ error: "internal_error", message: "Failed to list records" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [person] = await db.select().from(missingPersonsTable).where(eq(missingPersonsTable.id, id));
    if (!person) {
      return res.status(404).json({ error: "not_found", message: "Missing person not found" });
    }
    res.json(formatPerson(person));
  } catch (err) {
    req.log.error({ err }, "Failed to get missing person");
    res.status(500).json({ error: "internal_error", message: "Failed to get record" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateMissingPersonBody.parse(req.body);
    const embedding = generateFakeEmbedding(body.photoUrl);

    const [person] = await db
      .insert(missingPersonsTable)
      .values({
        ...body,
        description: body.description ?? null,
        contactEmail: body.contactEmail ?? null,
        photoUrl: body.photoUrl ?? null,
        faceEmbedding: embedding,
        caseNumber: generateCaseNumber(),
        status: "active",
      })
      .returning();

    await db.insert(alertsTable).values({
      missingPersonId: person.id,
      missingPersonName: person.name,
      type: "new_case",
      message: `New missing person case registered: ${person.name} (${person.caseNumber})`,
      status: "pending",
    });

    res.status(201).json(formatPerson(person));
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "validation_error", message: err.message });
    }
    req.log.error({ err }, "Failed to create missing person");
    res.status(500).json({ error: "internal_error", message: "Failed to create record" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = UpdateMissingPersonBody.parse(req.body);

    const [existing] = await db.select().from(missingPersonsTable).where(eq(missingPersonsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "not_found", message: "Missing person not found" });
    }

    const updateData: Record<string, any> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.photoUrl !== undefined) {
      updateData.faceEmbedding = generateFakeEmbedding(body.photoUrl);
    }

    const [updated] = await db
      .update(missingPersonsTable)
      .set(updateData)
      .where(eq(missingPersonsTable.id, id))
      .returning();

    if (body.status && body.status !== existing.status) {
      const statusMessages: Record<string, string> = {
        found: `Missing person ${updated.name} (${updated.caseNumber}) has been found!`,
        closed: `Case ${updated.caseNumber} for ${updated.name} has been closed.`,
        active: `Case ${updated.caseNumber} for ${updated.name} has been re-opened.`,
      };
      const alertType = body.status === "found" ? "case_updated" : "case_closed";
      await db.insert(alertsTable).values({
        missingPersonId: id,
        missingPersonName: updated.name,
        type: alertType,
        message: statusMessages[body.status] ?? `Case status updated for ${updated.name}`,
        status: "pending",
      });
    }

    res.json(formatPerson(updated));
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "validation_error", message: err.message });
    }
    req.log.error({ err }, "Failed to update missing person");
    res.status(500).json({ error: "internal_error", message: "Failed to update record" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [existing] = await db.select().from(missingPersonsTable).where(eq(missingPersonsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "not_found", message: "Missing person not found" });
    }
    await db.delete(missingPersonsTable).where(eq(missingPersonsTable.id, id));
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete missing person");
    res.status(500).json({ error: "internal_error", message: "Failed to delete record" });
  }
});

function formatPerson(p: any) {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    description: p.description ?? null,
    lastSeenLocation: p.lastSeenLocation,
    lastSeenDate: p.lastSeenDate,
    contactName: p.contactName,
    contactPhone: p.contactPhone,
    contactEmail: p.contactEmail ?? null,
    status: p.status,
    photoUrl: p.photoUrl ?? null,
    faceEmbedding: p.faceEmbedding ?? null,
    caseNumber: p.caseNumber,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

export default router;
