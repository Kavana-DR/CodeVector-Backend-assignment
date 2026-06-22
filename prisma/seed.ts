import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main(): Promise<void> {
  console.log("Seeding categories...");
  await seedCategories();
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
