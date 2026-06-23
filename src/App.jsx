import { useEffect, useState } from "react";

import { fetchProducts } from "./api";

const categories = [
  { label: "All", value: "" },
  { label: "electronics", value: "electronics" },
  { label: "books", value: "books" },
  { label: "clothing", value: "clothing" },
  { label: "grocery", value: "grocery" },
  { label: "home-and-kitchen", value: "home-and-kitchen" },
  {
    label: "beauty-and-personal-care",
    value: "beauty-and-personal-care",
  },
  { label: "toys-and-games", value: "toys-and-games" },
  { label: "office-supplies", value: "office-supplies" },
  { label: "automotive", value: "automotive" },
];

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadProducts({ selectedCategory = category, cursor } = {}) {
    try {
      setLoading(true);
      setError("");

      const result = await fetchProducts({
        category: selectedCategory,
        cursor,
      });

      setProducts(result.data);
      setNextCursor(result.pagination.nextCursor);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleCategoryChange(event) {
    const selectedCategory = event.target.value;

    setCategory(selectedCategory);
    setNextCursor(null);
    loadProducts({ selectedCategory });
  }

  function handleNextPage() {
    if (!nextCursor) {
      return;
    }

    loadProducts({ cursor: nextCursor });
  }

  return (
    <main className="container">
      <h1>Product Catalog</h1>

      <div className="controls">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={handleCategoryChange}
          disabled={loading}
        >
          {categories.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category.slug}</td>
                  <td>${product.price}</td>
                  <td>{new Date(product.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && <p>No products found.</p>}

          <button
            type="button"
            onClick={handleNextPage}
            disabled={!nextCursor || loading}
          >
            Next Page
          </button>
        </>
      )}
    </main>
  );
}

export default App;
