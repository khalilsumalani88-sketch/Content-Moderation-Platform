import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import storesRouter from "./stores.js";
import productsRouter from "./products.js";
import categoriesRouter from "./categories.js";
import ordersRouter from "./orders.js";
import dashboardRouter from "./dashboard.js";
import subscriptionsRouter from "./subscriptions.js";
import aiRouter from "./ai.js";
import adminRouter from "./admin.js";
import referralsRouter from "./referrals.js";
import growthRouter from "./growth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storesRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(dashboardRouter);
router.use(subscriptionsRouter);
router.use(aiRouter);
router.use(adminRouter);
router.use(referralsRouter);
router.use(growthRouter);

export default router;
