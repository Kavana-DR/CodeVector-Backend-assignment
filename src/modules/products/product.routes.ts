import { Router } from "express";

import { listProducts } from "./product.controller";

export const productRouter = Router();

productRouter.get("/", listProducts);
