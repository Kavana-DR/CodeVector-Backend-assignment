import { toProductListItem } from "./product.mapper";
import { productRepository } from "./product.repository";
import { ProductListResult } from "./product.types";

const DEFAULT_PAGE_SIZE = 20;

export const productService = {
  async listNewest(): Promise<ProductListResult> {
    const products = await productRepository.findNewest(DEFAULT_PAGE_SIZE);

    return {
      data: products.map(toProductListItem),
    };
  },
};
