import { RequestHandler } from "express";

import { productService } from "./product.service";
import { parseProductListQuery } from "./product.validation";

export const listProducts: RequestHandler = async (request, response) => {
  const query = parseProductListQuery(request.query);
  const result = await productService.listNewest(query);

  response.status(200).json(result);
};
