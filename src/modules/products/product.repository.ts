import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/database/prisma";
import { ProductListQuery } from "./product.types";

export const productRepository = {
  findNewest(query: ProductListQuery) {
    const hasCursor =
      query.cursorCreatedAt !== undefined && query.cursorId !== undefined;
    const where: Prisma.ProductWhereInput = {
      category: query.category ? { slug: query.category } : undefined,
      OR: hasCursor
        ? [
            { createdAt: { lt: query.cursorCreatedAt } },
            {
              createdAt: query.cursorCreatedAt,
              id: { lt: query.cursorId },
            },
          ]
        : undefined,
    };

    return prisma.product.findMany({
      take: query.limit,
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
  },
};
