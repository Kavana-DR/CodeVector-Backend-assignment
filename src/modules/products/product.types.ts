export interface ProductListItem {
  id: string;
  name: string;
  category: {
    name: string;
    slug: string;
  };
  price: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListQuery {
  limit: number;
  category?: string;
  sort?: "price_asc" | "price_desc";
  cursorCreatedAt?: Date;
  cursorId?: bigint;
}

export interface ProductListResult {
  data: ProductListItem[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: {
      createdAt: string;
      id: string;
    } | null;
  };
}
