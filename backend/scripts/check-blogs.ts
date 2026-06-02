import { prisma } from "../src/lib/prisma.js";

async function main() {
  const blogs = await prisma.blog.findMany({
    select: { title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\nTotal blogs: ${blogs.length}\n`);
  blogs.forEach((b, i) => {
    console.log(`${i + 1}. [${b.createdAt.toISOString().slice(0, 19)}] ${b.title}`);
  });

  await prisma.$disconnect();
}

main();
