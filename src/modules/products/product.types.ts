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
