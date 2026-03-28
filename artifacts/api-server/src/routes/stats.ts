import { Router, type IRouter } from "express";
import { db, missingPersonsTable, searchesTable, alertsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const [persons, searches, alerts] = await Promise.all([
      db.select().from(missingPersonsTable),
      db.select().from(searchesTable),
      db.select().from(alertsTable),
    ]);

    const totalCases = persons.length;
    const activeCases = persons.filter((p) => p.status === "active").length;
    const foundCases = persons.filter((p) => p.status === "found").length;
    const closedCases = persons.filter((p) => p.status === "closed").length;

    const totalSearches = searches.length;
    const totalAlerts = alerts.length;
    const pendingAlerts = alerts.filter((a) => a.status === "pending").length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMatches = alerts.filter(
      (a) => a.type === "match_found" && new Date(a.createdAt) >= sevenDaysAgo
    ).length;

    res.json({
      totalCases,
      activeCases,
      foundCases,
      closedCases,
      totalSearches,
      totalAlerts,
      pendingAlerts,
      recentMatches,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "internal_error", message: "Failed to get stats" });
  }
});

export default router;
