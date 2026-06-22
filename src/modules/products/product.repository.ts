import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { ProductListQuery } from "./product.types";

export const productRepository = {
  async findNewest(query: ProductListQuery) {
    let cursorFilter: Prisma.ProductWhereInput | undefined;

    if (query.cursorCreatedAt !== undefined && query.cursorId !== undefined) {
      if (query.sort === "price_asc" || query.sort === "price_desc") {
        const cursorProduct = await prisma.product.findUnique({
          where: { id: query.cursorId },
          select: { price: true },
        });

        if (!cursorProduct) {
          throw new AppError(
            400,
            "INVALID_CURSOR",
            "The cursor product no longer exists",
          );
        }

        cursorFilter =
          query.sort === "price_asc"
            ? {
                OR: [
                  { price: { gt: cursorProduct.price } },
                  {
                    price: cursorProduct.price,
                    id: { gt: query.cursorId },
                  },
                ],
              }
            : {
                OR: [
                  { price: { lt: cursorProduct.price } },
                  {
                    price: cursorProduct.price,
                    id: { lt: query.cursorId },
                  },
                ],
              };
      } else {
        cursorFilter = {
          OR: [
            { createdAt: { lt: query.cursorCreatedAt } },
            {
              createdAt: query.cursorCreatedAt,
              id: { lt: query.cursorId },
            },
          ],
        };
      }
    }

    const where: Prisma.ProductWhereInput = {
      category: query.category ? { slug: query.category } : undefined,
      ...cursorFilter,
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      query.sort === "price_asc"
        ? [{ price: "asc" }, { id: "asc" }]
        : query.sort === "price_desc"
          ? [{ price: "desc" }, { id: "desc" }]
          : [{ createdAt: "desc" }, { id: "desc" }];

    return prisma.product.findMany({
      take: query.limit,
      where,
      orderBy,
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
