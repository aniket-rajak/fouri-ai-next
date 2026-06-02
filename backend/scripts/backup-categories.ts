import { prisma } from "../src/lib/prisma.js";

async function main() {
  const blogs = await prisma.blog.findMany({
    where: { categoryId: { not: null } },
    select: { id: true, title: true, categoryId: true },
  });

  console.log(`Found ${blogs.length} blogs with categories:\n`);
  blogs.forEach((b, i) => {
    console.log(`${i + 1}. [${b.id}] "${b.title}" -> categoryId: ${b.categoryId}`);
  });

  // Save backup as JSON
  const fs = await import("fs");
  const path = await import("path");
  const backupPath = path.join(import.meta.dirname, "..", "category-backup.json");
  fs.writeFileSync(backupPath, JSON.stringify(blogs, null, 2));
  console.log(`\nBackup saved to: ${backupPath}`);

  await prisma.$disconnect();
}

main();
