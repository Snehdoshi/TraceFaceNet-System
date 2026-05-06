import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { db, missingPersonsTable, searchesTable, alertsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { PerformSearchBody } from "@workspace/api-zod";

const router: IRouter = Router();

function hammingSimilarity(aHex: string, bHex: string): number {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let differingBits = 0;
  for (let i = 0; i < length; i++) {
    let xor = a[i] ^ b[i];
    while (xor) {
      differingBits += xor & 1;
      xor >>= 1;
    }
  }

  return Math.max(0, 1 - differingBits / (length * 8));
}

function getConfidence(similarity: number): "high" | "medium" | "low" {
  if (similarity >= 0.85) return "high";
  if (similarity >= 0.70) return "medium";
  return "low";
}

async function sourceToBytes(source: string): Promise<Uint8Array> {
  if (source.startsWith("data:")) {
    const commaIndex = source.indexOf(",");
    const payload = commaIndex >= 0 ? source.slice(commaIndex + 1) : "";
    return Buffer.from(payload, source.includes(";base64,") ? "base64" : "utf8");
  }

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch query image: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  return Buffer.from(source, "utf8");
}

async function generateQueryFingerprint(queryImageUrl: string): Promise<string> {
  const bytes = await sourceToBytes(queryImageUrl);
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizeStoredFingerprint(faceEmbedding: string): string {
  const trimmed = faceEmbedding.trim();
  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return createHash("sha256").update(trimmed, "utf8").digest("hex");
}

router.post("/", async (req, res) => {
  try {
    const body = PerformSearchBody.parse(req.body);
    const threshold = body.confidence ?? 0.6;
    const startTime = Date.now();

    const allPersons = await db
      .select()
      .from(missingPersonsTable)
      .where(eq(missingPersonsTable.status, "active"));

    const queryFingerprint = await generateQueryFingerprint(body.queryImageUrl);

    const matches: Array<{
      missingPersonId: number;
      missingPersonName: string;
      similarity: number;
      confidence: "high" | "medium" | "low";
      photoUrl: string | null;
      caseNumber: string;
      lastSeenLocation: string;
    }> = [];

    for (const person of allPersons) {
      if (!person.faceEmbedding) continue;

      let similarity: number;
      try {
        const storedFingerprint = normalizeStoredFingerprint(person.faceEmbedding);
        similarity = hammingSimilarity(queryFingerprint, storedFingerprint);
      } catch {
        continue;
      }

      if (similarity >= threshold) {
        matches.push({
          missingPersonId: person.id,
          missingPersonName: person.name,
          similarity: Math.round(similarity * 1000) / 1000,
          confidence: getConfidence(similarity),
          photoUrl: person.photoUrl ?? null,
          caseNumber: person.caseNumber,
          lastSeenLocation: person.lastSeenLocation,
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = matches.slice(0, 10);
    const searchDurationMs = Date.now() - startTime;

    const [search] = await db
      .insert(searchesTable)
      .values({
        queryImageUrl: body.queryImageUrl,
        location: body.location ?? null,
        matches: JSON.stringify(topMatches),
        totalMatches: topMatches.length,
        searchDurationMs,
      })
      .returning();

    for (const match of topMatches.filter((m) => m.confidence === "high")) {
      await db.insert(alertsTable).values({
        missingPersonId: match.missingPersonId,
        missingPersonName: match.missingPersonName,
        type: "match_found",
        message: `High-confidence face match found for ${match.missingPersonName} (${match.caseNumber}) — similarity: ${(match.similarity * 100).toFixed(1)}%`,
        status: "pending",
        similarity: match.similarity,
        location: body.location ?? null,
      });
    }

    return res.json({
      id: search.id,
      queryImageUrl: search.queryImageUrl,
      location: search.location ?? null,
      matches: topMatches,
      totalMatches: topMatches.length,
      searchDurationMs,
      createdAt: search.createdAt instanceof Date ? search.createdAt.toISOString() : search.createdAt,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "validation_error", message: err.message });
    }
    req.log.error({ err }, "Failed to perform search");
    return res.status(500).json({ error: "internal_error", message: "Failed to perform search" });
  }
});

router.get("/", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const searches = await db
      .select()
      .from(searchesTable)
      .orderBy(desc(searchesTable.createdAt))
      .limit(limit);

    const formatted = searches.map((s) => {
      let parsedMatches = [];
      try {
        parsedMatches = JSON.parse(s.matches);
      } catch {}
      return {
        id: s.id,
        queryImageUrl: s.queryImageUrl,
        location: s.location ?? null,
        matches: parsedMatches,
        totalMatches: s.totalMatches,
        searchDurationMs: s.searchDurationMs,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      };
    });

    return res.json({ data: formatted, total: formatted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list searches");
    return res.status(500).json({ error: "internal_error", message: "Failed to list searches" });
  }
});

export default router;
