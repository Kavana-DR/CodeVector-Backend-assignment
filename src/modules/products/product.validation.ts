import { ParsedQs } from "qs";
import { z } from "zod";

import { AppError } from "../../shared/errors/app-error";
import { ProductListQuery } from "./product.types";

const productListQuerySchema = z
  .object({
    category: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "category must be a lowercase slug",
      )
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["price_asc", "price_desc"]).optional(),
    cursorCreatedAt: z.coerce.date().optional(),
    cursorId: z
      .string()
      .regex(/^\d+$/, "cursorId must be a positive integer")
      .transform((value) => BigInt(value))
      .optional(),
  })
  .superRefine((query, context) => {
    const hasCreatedAt = query.cursorCreatedAt !== undefined;
    const hasId = query.cursorId !== undefined;

    if (hasCreatedAt !== hasId) {
      context.addIssue({
        code: "custom",
        message: "cursorCreatedAt and cursorId must be provided together",
      });
    }
  });

export function parseProductListQuery(query: ParsedQs): ProductListQuery {
  const result = productListQuerySchema.safeParse(query);

  if (!result.success) {
    throw new AppError(
      400,
      "INVALID_QUERY",
      result.error.issues[0]?.message ?? "Invalid product query parameters",
    );
  }

  return result.data;
}
