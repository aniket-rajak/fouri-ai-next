import { prisma } from "../src/lib/prisma.js";

async function main() {
  const blogs = await prisma.blog.findMany({
    where: { title: { contains: "Analyze Your Mock Test Results" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, createdAt: true },
  });

  console.log(`Found ${blogs.length} matching blogs:\n`);
  blogs.forEach((b, i) => console.log(`${i + 1}. [${b.id}] ${b.title} @ ${b.createdAt.toISOString()}`));

  if (blogs.length > 1) {
    const keep = blogs[blogs.length - 1];
    const toDelete = blogs.slice(0, -1);
    for (const b of toDelete) {
      await prisma.blog.delete({ where: { id: b.id } });
      console.log(`\nDeleted duplicate: ${b.id}`);
    }
    console.log(`\nKept: ${keep.id}`);
  }

  await prisma.$disconnect();
}

main();
