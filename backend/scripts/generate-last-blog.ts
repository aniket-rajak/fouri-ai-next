import { prisma } from "../src/lib/prisma.js";
import { generateBlogContent } from "../src/services/openai.js";

const TITLE = "How to Analyze Your Mock Test Results: A Step-by-Step Guide to Identify Weak Areas";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 200);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter++;
  }
}

async function main() {
  console.log(`Generating: "${TITLE}"`);
  const instructions = `Write a detailed, SEO-optimized blog post with this exact title: "${TITLE}". Make it at least 1000 words, use proper headings, bullet points, and actionable advice. Target Indian students preparing for competitive exams. Output must be valid HTML with inline CSS.`;
  const generated = await generateBlogContent(instructions);
  const slug = await ensureUniqueSlug(generateSlug(generated.title));
  const blog = await prisma.blog.create({
    data: {
      title: generated.title,
      slug,
      excerpt: generated.excerpt || null,
      content: generated.content,
      thumbnailUrl: null,
      authorName: "FOURI Team",
      status: "DRAFT",
      publishedAt: null,
      categoryId: null,
    },
  });
  console.log(`✅ Created: "${generated.title}" (ID: ${blog.id})`);
  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
