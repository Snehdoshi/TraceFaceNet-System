import { Router, type IRouter } from "express";
import healthRouter from "./health";
import missingPersonsRouter from "./missing-persons";
import searchesRouter from "./searches";
import alertsRouter from "./alerts";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/missing-persons", missingPersonsRouter);
router.use("/searches", searchesRouter);
router.use("/alerts", alertsRouter);
router.use("/stats", statsRouter);

export default router;
