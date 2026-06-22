import { Router } from "express";

import { productRouter } from "../modules/products/product.routes";
import { healthRouter } from "./health.routes";

export const router = Router();

router.use("/health", healthRouter);
router.use("/products", productRouter);
