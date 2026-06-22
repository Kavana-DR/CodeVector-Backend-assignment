import { toProductListItem } from "./product.mapper";
import { productRepository } from "./product.repository";
import { ProductListQuery, ProductListResult } from "./product.types";

export const productService = {
  async listNewest(query: ProductListQuery): Promise<ProductListResult> {
    const products = await productRepository.findNewest({
      ...query,
      limit: query.limit + 1,
    });
    const hasMore = products.length > query.limit;
    const page = hasMore ? products.slice(0, query.limit) : products;
    const lastProduct = page.at(-1);

    return {
      data: page.map(toProductListItem),
      pagination: {
        limit: query.limit,
        hasMore,
        nextCursor:
          hasMore && lastProduct
            ? {
                createdAt: lastProduct.createdAt.toISOString(),
                id: lastProduct.id.toString(),
              }
            : null,
      },
    };
  },
};
