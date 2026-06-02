import { prisma } from "../src/lib/prisma.js";
import { generateBlogContent } from "../src/services/openai.js";

const BLOG_TITLES = [
  "How to Crack JEE Mains 2026: A Complete Month-Wise Preparation Strategy",
  "NEET UG 2026: Top 10 Biology Topics That Carry the Highest Marks",
  "Why Most Students Fail in Mock Tests (And How to Fix It in 30 Days)",
  "JEE Advanced vs JEE Mains: Key Differences, Syllabus Changes, and Preparation Tips for 2026",
  "7 Proven Study Techniques to Boost Your Retention for Competitive Exams",
  "How AI-Powered Mock Tests Can Improve Your Score by 20% (Backed by Data)",
  "WBJEE 2026: Complete Guide to Syllabus, Exam Pattern, and Previous Year Trends",
  "CUET UG 2026: Subject-Wise Preparation Strategy for Science, Commerce & Arts Students",
  "Common Mistakes Students Make During Online Mock Tests (And How to Avoid Them)",
  "How to Analyze Your Mock Test Results: A Step-by-Step Guide to Identify Weak Areas",
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing || (excludeId && existing.id === excludeId)) return slug;
    slug = `${base}-${counter}`;
    counter++;
  }
}

async function main() {
  console.log(`Starting generation of ${BLOG_TITLES.length} blog posts...\n`);

  for (let i = 0; i < BLOG_TITLES.length; i++) {
    const title = BLOG_TITLES[i];
    console.log(`[${i + 1}/${BLOG_TITLES.length}] Generating: "${title}"`);

    try {
      const instructions = `Write a detailed, SEO-optimized blog post with this exact title: "${title}". Make it at least 1000 words, use proper headings, bullet points, and actionable advice. Target Indian students preparing for competitive exams. Output must be valid HTML with inline CSS.`;
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

      console.log(`   ✅ Created: "${generated.title}" (slug: ${slug})`);
      console.log(`      ID: ${blog.id}\n`);
    } catch (error) {
      console.error(`   ❌ Failed: "${title}"`, error instanceof Error ? error.message : error);
      console.log("");
    }
  }

  console.log("Done!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
