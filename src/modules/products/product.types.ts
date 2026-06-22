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

export interface ProductListResult {
  data: ProductListItem[];
}
