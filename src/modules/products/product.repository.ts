import { prisma } from "../../infrastructure/database/prisma";

export const productRepository = {
  findNewest(limit: number) {
    return prisma.product.findMany({
      take: limit,
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
