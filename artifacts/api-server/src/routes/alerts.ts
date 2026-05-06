import { Router, type IRouter } from "express";
import { db, alertsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateAlertBody, UpdateAlertBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { status, limit = "50" } = req.query as Record<string, string>;
    const lim = parseInt(limit, 10);

    const all = await db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt));
    const filtered = status ? all.filter((a) => a.status === status) : all;
    const paginated = filtered.slice(0, lim);
    const unread = all.filter((a) => a.status === "pending").length;

    return res.json({
      data: paginated.map(formatAlert),
      total: filtered.length,
      unread,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list alerts");
    return res.status(500).json({ error: "internal_error", message: "Failed to list alerts" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateAlertBody.parse(req.body);
    const [alert] = await db
      .insert(alertsTable)
      .values({
        ...body,
        missingPersonId: body.missingPersonId ?? null,
        similarity: body.similarity ?? null,
        location: body.location ?? null,
        status: "pending",
      })
      .returning();

    return res.status(201).json(formatAlert(alert));
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "validation_error", message: err.message });
    }
    req.log.error({ err }, "Failed to create alert");
    return res.status(500).json({ error: "internal_error", message: "Failed to create alert" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = UpdateAlertBody.parse(req.body);

    const [existing] = await db.select().from(alertsTable).where(eq(alertsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "not_found", message: "Alert not found" });
    }

    const updateData: Record<string, any> = { status: body.status };
    if (body.status === "acknowledged" && !existing.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
    }

    const [updated] = await db
      .update(alertsTable)
      .set(updateData)
      .where(eq(alertsTable.id, id))
      .returning();

    return res.json(formatAlert(updated));
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "validation_error", message: err.message });
    }
    req.log.error({ err }, "Failed to update alert");
    return res.status(500).json({ error: "internal_error", message: "Failed to update alert" });
  }
});

function formatAlert(a: any) {
  return {
    id: a.id,
    missingPersonId: a.missingPersonId ?? null,
    missingPersonName: a.missingPersonName ?? null,
    type: a.type,
    message: a.message,
    status: a.status,
    similarity: a.similarity ?? null,
    location: a.location ?? null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    acknowledgedAt: a.acknowledgedAt instanceof Date ? a.acknowledgedAt.toISOString() : a.acknowledgedAt ?? null,
  };
}

export default router;
