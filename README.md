# Product Catalog API

A Node.js, Express, Prisma, and PostgreSQL backend for browsing a large product catalog with fast cursor pagination.

This project is built around the CodeVector backend assignment:

- Browse around 200,000 products
- Show products newest first by default
- Filter products by category
- Support fast pagination
- Avoid duplicate or skipped products while users paginate
- Seed the database with 200,000 generated products

## Tech stack

- Node.js 20+
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod for request query validation

## Project structure

```txt
prisma/
  migrations/                  Database migrations
  schema.prisma                Prisma database schema
  seed.ts                      Seed script for categories and products

src/
  app.ts                       Express app setup
  server.ts                    Server startup and graceful shutdown
  config/
    env.ts                     Environment variable validation
  infrastructure/
    database/
      prisma.ts                Shared Prisma client
  middleware/
    error-handler.ts           Centralized error handling
    not-found.ts               404 handler
  routes/
    index.ts                   Main route registration
    health.routes.ts           Health endpoint
  shared/
    errors/
      app-error.ts             Application error class
  modules/
    products/
      product.routes.ts        Product route definitions
      product.controller.ts    HTTP request/response handling
      product.validation.ts    Query parameter validation
      product.service.ts       Business logic and pagination response shape
      product.repository.ts    Prisma queries
      product.mapper.ts        Database-to-API response mapping
      product.types.ts         Product API types
```

## Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
NODE_ENV=development
```

For Supabase, use the PostgreSQL connection string from your Supabase project settings.

Do not commit `.env`.

## Install dependencies

```bash
npm install
```

## Database setup

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run the initial migration:

```bash
npm run prisma:migrate
```

Seed the database:

```bash
npm run prisma:seed
```

The seed script inserts:

- 10 categories
- 200,000 products

Products are inserted in batches instead of one row at a time.

## Run the API

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Type check:

```bash
npm run typecheck
```

## Endpoints

### Health check

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-23T10:00:00.000Z"
}
```

### List products

```http
GET /products
```

Supported query parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `limit` | No | Number of products to return. Defaults to `20`. Maximum `100`. |
| `category` | No | Filters products by category slug, for example `electronics`. |
| `cursorCreatedAt` | No | Cursor timestamp from the previous response. Must be used with `cursorId`. |
| `cursorId` | No | Cursor product ID from the previous response. Must be used with `cursorCreatedAt`. |
| `sort` | No | Supports `price_asc` and `price_desc`. If omitted, products are sorted newest first. |

Example:

```http
GET /products?limit=5&category=electronics
```

Example response:

```json
{
  "data": [
    {
      "id": "200000",
      "name": "Premium Headphones 200000",
      "category": {
        "name": "Electronics",
        "slug": "electronics"
      },
      "price": "199.99",
      "createdAt": "2026-06-22T14:30:00.000Z",
      "updatedAt": "2026-06-22T14:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 5,
    "hasMore": true,
    "nextCursor": {
      "createdAt": "2026-06-22T14:30:00.000Z",
      "id": "199996"
    }
  }
}
```

To fetch the next page, pass the returned cursor back:

```http
GET /products?limit=5&category=electronics&cursorCreatedAt=2026-06-22T14:30:00.000Z&cursorId=199996
```

Price sorting examples:

```http
GET /products?sort=price_asc&limit=10
GET /products?sort=price_desc&limit=10
```

## Pagination design

The default product listing uses cursor pagination ordered by:

```txt
created_at DESC, id DESC
```

The `id` field is used as a tie-breaker because many products can have the same `created_at` timestamp.

This avoids the main problems of offset pagination:

- Slow deep pages, because the database must skip many rows
- Duplicate products when new rows are inserted while browsing
- Missed products when rows are inserted or updated between page requests

Instead of asking for "page 50", the client asks for "the next products after this last product I already saw".

## Database schema

Main models:

- `Category`
- `Product`

Important product fields:

- `id`
- `name`
- `categoryId`
- `price`
- `createdAt`
- `updatedAt`

Important indexes:

```prisma
@@index([createdAt(sort: Desc), id(sort: Desc)], map: "products_created_at_id_idx")
@@index([categoryId, createdAt(sort: Desc), id(sort: Desc)], map: "products_category_created_at_id_idx")
```

Why these indexes exist:

- `(createdAt DESC, id DESC)` supports the default newest-first cursor pagination.
- `(categoryId, createdAt DESC, id DESC)` supports category-filtered newest-first cursor pagination.
- `Category.slug` is unique so category filters can resolve efficiently.

## Notes on sorting

The API supports:

- default newest-first ordering
- `sort=price_asc`
- `sort=price_desc`

Price sorting is applied in the database query, not in memory.

If price sorting becomes a primary production requirement, useful follow-up indexes would be:

```prisma
@@index([price, id])
@@index([categoryId, price, id])
```

Those are not required for the original newest-first assignment, but they would improve deep cursor pagination when sorting by price.

## Error handling

Invalid requests return structured JSON errors through centralized middleware.

Examples of invalid product queries:

- `limit` greater than `100`
- invalid `category` slug format
- providing `cursorCreatedAt` without `cursorId`
- providing `cursorId` without `cursorCreatedAt`
- unsupported `sort` values

## Assignment focus

The core engineering idea in this project is not just returning products. It is returning products in a stable order that remains correct while the underlying dataset changes.

The most important design choices are:

- Use PostgreSQL for predictable indexing and ordering
- Use cursor pagination instead of offset pagination
- Use `(created_at, id)` as a compound cursor
- Use database-level filtering and ordering
- Keep HTTP, business logic, and database access separated
