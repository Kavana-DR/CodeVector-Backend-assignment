import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCT_COUNT = 200_000;
const BATCH_SIZE = 2_000;
const RANDOM_SEED = 20_260_622;
const TWO_YEARS_IN_MS = 2 * 365 * 24 * 60 * 60 * 1_000;
const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1_000;

const categories = [
  { name: "Electronics", slug: "electronics" },
  { name: "Clothing", slug: "clothing" },
  { name: "Home and Kitchen", slug: "home-and-kitchen" },
  { name: "Books", slug: "books" },
  { name: "Sports and Outdoors", slug: "sports-and-outdoors" },
  { name: "Beauty and Personal Care", slug: "beauty-and-personal-care" },
  { name: "Toys and Games", slug: "toys-and-games" },
  { name: "Automotive", slug: "automotive" },
  { name: "Grocery", slug: "grocery" },
  { name: "Office Supplies", slug: "office-supplies" },
] as const;

type CategorySlug = (typeof categories)[number]["slug"];

const categoryWeights: ReadonlyArray<{
  slug: CategorySlug;
  weight: number;
}> = [
  { slug: "electronics", weight: 18 },
  { slug: "clothing", weight: 14 },
  { slug: "home-and-kitchen", weight: 13 },
  { slug: "books", weight: 10 },
  { slug: "sports-and-outdoors", weight: 10 },
  { slug: "beauty-and-personal-care", weight: 9 },
  { slug: "toys-and-games", weight: 8 },
  { slug: "automotive", weight: 7 },
  { slug: "grocery", weight: 6 },
  { slug: "office-supplies", weight: 5 },
];

const productTypes: Record<CategorySlug, readonly string[]> = {
  electronics: ["Wireless Headphones", "Mechanical Keyboard", "Smart Watch", "USB-C Hub", "Portable Speaker"],
  clothing: ["Cotton T-Shirt", "Denim Jacket", "Running Shoes", "Classic Hoodie", "Chino Trousers"],
  "home-and-kitchen": ["Coffee Maker", "Storage Container Set", "Table Lamp", "Nonstick Frying Pan", "Cotton Bedsheet"],
  books: ["Modern History", "Practical Programming", "Mystery Novel", "Personal Finance Guide", "Science Encyclopedia"],
  "sports-and-outdoors": ["Yoga Mat", "Hiking Backpack", "Football", "Resistance Band Set", "Insulated Water Bottle"],
  "beauty-and-personal-care": ["Face Moisturizer", "Shampoo", "Sunscreen Lotion", "Hair Dryer", "Body Wash"],
  "toys-and-games": ["Building Block Set", "Strategy Board Game", "Remote Control Car", "Jigsaw Puzzle", "Plush Toy"],
  automotive: ["Car Phone Mount", "Microfiber Cleaning Kit", "Portable Tyre Inflator", "Seat Organizer", "Emergency Tool Kit"],
  grocery: ["Arabica Coffee Beans", "Organic Green Tea", "Mixed Nuts", "Dark Chocolate", "Whole Grain Pasta"],
  "office-supplies": ["Hardcover Notebook", "Gel Pen Set", "Desk Organizer", "Document Folder", "Ergonomic Mouse Pad"],
};

const adjectives = [
  "Classic",
  "Compact",
  "Essential",
  "Premium",
  "Everyday",
  "Modern",
  "Professional",
  "Lightweight",
] as const;

const priceRangesInCents: Record<CategorySlug, readonly [number, number]> = {
  electronics: [1_499, 99_999],
  clothing: [799, 24_999],
  "home-and-kitchen": [499, 49_999],
  books: [299, 4_999],
  "sports-and-outdoors": [599, 39_999],
  "beauty-and-personal-care": [199, 14_999],
  "toys-and-games": [399, 19_999],
  automotive: [499, 29_999],
  grocery: [99, 4_999],
  "office-supplies": [99, 9_999],
};

interface SeedCategory {
  id: number;
  slug: CategorySlug;
  weight: number;
}

function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomItem<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];

  if (item === undefined) {
    throw new Error("Cannot select a random item from an empty collection");
  }

  return item;
}

function selectCategory(
  seedCategories: readonly SeedCategory[],
  random: () => number,
): SeedCategory {
  const totalWeight = seedCategories.reduce(
    (total, category) => total + category.weight,
    0,
  );
  let selection = random() * totalWeight;

  for (const category of seedCategories) {
    selection -= category.weight;
    if (selection < 0) {
      return category;
    }
  }

  const fallback = seedCategories.at(-1);
  if (fallback === undefined) {
    throw new Error("No categories are available for product generation");
  }

  return fallback;
}

function generateProduct(
  sequence: number,
  seedCategories: readonly SeedCategory[],
  random: () => number,
  now: number,
): Prisma.ProductCreateManyInput {
  const category = selectCategory(seedCategories, random);
  const adjective = randomItem(adjectives, random);
  const productType = randomItem(productTypes[category.slug], random);
  const [minimumPrice, maximumPrice] = priceRangesInCents[category.slug];
  const priceInCents =
    minimumPrice + Math.floor(random() * (maximumPrice - minimumPrice + 1));

  // Minute-level buckets deliberately create equal timestamps for cursor tests.
  const ageInMs = Math.floor(random() * random() * TWO_YEARS_IN_MS);
  const createdAtMs = Math.floor((now - ageInMs) / 60_000) * 60_000;
  const maximumUpdateDelay = Math.min(
    NINETY_DAYS_IN_MS,
    now - createdAtMs,
  );
  const updateDelay =
    random() < 0.65 ? 0 : Math.floor(random() * maximumUpdateDelay);

  return {
    name: `${adjective} ${productType} ${sequence + 1}`,
    categoryId: category.id,
    price: (priceInCents / 100).toFixed(2),
    createdAt: new Date(createdAtMs),
    updatedAt: new Date(createdAtMs + updateDelay),
  };
}

async function seedCategories(): Promise<void> {
  await Promise.all(
    categories.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name },
        create: category,
      }),
    ),
  );
}

async function getSeedCategories(): Promise<SeedCategory[]> {
  const storedCategories = await prisma.category.findMany({
    where: { slug: { in: categories.map((category) => category.slug) } },
    select: { id: true, slug: true },
  });
  const idsBySlug = new Map(
    storedCategories.map((category) => [category.slug, category.id]),
  );

  return categoryWeights.map(({ slug, weight }) => {
    const id = idsBySlug.get(slug);
    if (id === undefined) {
      throw new Error(`Category ${slug} was not created`);
    }

    return { id, slug, weight };
  });
}

async function seedProducts(seedCategories: readonly SeedCategory[]): Promise<number> {
  const random = createRandom(RANDOM_SEED);
  const now = Date.now();
  let inserted = 0;

  for (let offset = 0; offset < PRODUCT_COUNT; offset += BATCH_SIZE) {
    const currentBatchSize = Math.min(BATCH_SIZE, PRODUCT_COUNT - offset);
    const batch = Array.from({ length: currentBatchSize }, (_, index) =>
      generateProduct(offset + index, seedCategories, random, now),
    );
    const result = await prisma.product.createMany({ data: batch });

    inserted += result.count;
    console.log(
      `Inserted ${inserted.toLocaleString()} / ${PRODUCT_COUNT.toLocaleString()} products`,
    );
  }

  return inserted;
}

async function main(): Promise<void> {
  console.log("Seeding categories...");
  await seedCategories();
  console.log(`Seeded ${categories.length} categories.`);

  const seedCategoryRecords = await getSeedCategories();
  console.log(
    `Seeding ${PRODUCT_COUNT.toLocaleString()} products in batches of ${BATCH_SIZE.toLocaleString()}...`,
  );
  const inserted = await seedProducts(seedCategoryRecords);
  const finalProductCount = await prisma.product.count();

  console.log(`Inserted ${inserted.toLocaleString()} products.`);
  console.log(
    `Products table now contains ${finalProductCount.toLocaleString()} rows.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
