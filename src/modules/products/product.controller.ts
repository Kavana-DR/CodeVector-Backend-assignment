import { RequestHandler } from "express";

import { productService } from "./product.service";

export const listProducts: RequestHandler = async (_request, response) => {
  const result = await productService.listNewest();

  response.status(200).json(result);
};
