import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import categoriesRouter from "./categories";
import transactionsRouter from "./transactions";
import loansRouter from "./loans";
import emisRouter from "./emis";
import insurancesRouter from "./insurances";
import investmentsRouter from "./investments";
import goalsRouter from "./goals";
import budgetsRouter from "./budgets";
import reportsRouter from "./reports";
import dbRouter from "./db";
import creditCardsRouter from "./credit_cards";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(categoriesRouter);
router.use(transactionsRouter);
router.use(loansRouter);
router.use(emisRouter);
router.use(insurancesRouter);
router.use(investmentsRouter);
router.use(goalsRouter);
router.use(budgetsRouter);
router.use(reportsRouter);
router.use(dbRouter);
router.use(creditCardsRouter);

export default router;

