import { Prisma } from "@prisma/client";

import { ProductListItem } from "./product.types";

interface ProductListRecord {
  id: bigint;
  name: string;
  price: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
  category: {
    name: string;
    slug: string;
  };
}

export function toProductListItem(product: ProductListRecord): ProductListItem {
  return {
    id: product.id.toString(),
    name: product.name,
    category: product.category,
    price: product.price.toFixed(2),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
