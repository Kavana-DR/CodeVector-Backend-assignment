const API_BASE_URL = "https://codevector-backend-assignment-3hgd.onrender.com";
const PRODUCT_LIMIT = 20;

export async function fetchProducts({ category, cursor } = {}) {
  const params = new URLSearchParams({
    limit: String(PRODUCT_LIMIT),
  });

  if (category) {
    params.set("category", category);
  }

  if (cursor) {
    params.set("cursorCreatedAt", cursor.createdAt);
    params.set("cursorId", cursor.id);
  }

  const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  return response.json();
}
