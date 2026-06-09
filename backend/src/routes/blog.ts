import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { validate, schemas } from "../middleware/validate.js";
import { generateBlogContent } from "../services/openai.js";
import * as analyticsService from "../services/analyticsService.js";
import { uploadToTelegram } from "../services/telegramStorage.js";
import { resolveFileUrl } from "../lib/resolveFileUrl.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
});

const router = Router();
const ownerRouter = Router();

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

const blogInclude = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
};

// ─── PUBLIC ROUTES ───

// GET /api/blog — List published blogs
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const skip = (page - 1) * limit;
    const categorySlug = (req.query.category as string) || "";
    const search = (req.query.search as string) || "";

    const where: any = {
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      ],
    };

    if (categorySlug) {
      const category = await prisma.blogCategory.findUnique({ where: { slug: categorySlug } });
      if (category) {
        where.categories = { some: { categoryId: category.id } };
      }
    }

    if (search.trim()) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: blogInclude,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
      }),
      prisma.blog.count({ where }),
    ]);

    const result = blogs.map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      content: b.content,
      thumbnailUrl: resolveFileUrl(b.thumbnailUrl, req),
      authorName: b.authorName,
      status: b.status,
      publishedAt: b.publishedAt,
      categories: b.categories.map((bc) => ({ id: bc.category.id, name: bc.category.name, slug: bc.category.slug })),
      tags: b.tags.map((bt) => ({ id: bt.tag.id, name: bt.tag.name, slug: bt.tag.slug })),
      createdAt: b.createdAt,
    }));

    res.json({
      blogs: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("List blogs error:", error);
    res.status(500).json({ error: "Failed to list blogs" });
  }
});

// GET /api/blog/:slug — Single blog by slug
router.get("/:slug", async (req, res) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: {
        slug: req.params.slug,
        OR: [
          { status: "PUBLISHED" },
          { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
        ],
      },
      include: blogInclude,
    });

    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    analyticsService.trackBlogView(blog.id, undefined, req.ip || req.socket.remoteAddress).catch(() => {});

    res.json({
      blog: {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        thumbnailUrl: resolveFileUrl(blog.thumbnailUrl, req),
        authorName: blog.authorName,
        status: blog.status,
        publishedAt: blog.publishedAt,
        categories: blog.categories.map((bc) => ({ id: bc.category.id, name: bc.category.name, slug: bc.category.slug })),
        tags: blog.tags.map((bt) => ({ id: bt.tag.id, name: bt.tag.name, slug: bt.tag.slug })),
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get blog error:", error);
    res.status(500).json({ error: "Failed to get blog" });
  }
});

// GET /api/blog/tags — All tags
router.get("/tags/list", async (_req, res) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ tags });
  } catch (error) {
    console.error("List tags error:", error);
    res.status(500).json({ error: "Failed to list tags" });
  }
});

// ─── OWNER ROUTES ───

// GET /api/owner/blog — List all blogs (any status)
ownerRouter.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || "";
    const categoryId = (req.query.categoryId as string) || "";
    const search = (req.query.search as string) || "";

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: blogInclude,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.blog.count({ where }),
    ]);

    const result = blogs.map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      content: b.content,
      thumbnailUrl: resolveFileUrl(b.thumbnailUrl, req),
      authorName: b.authorName,
      status: b.status,
      scheduledAt: b.scheduledAt,
      publishedAt: b.publishedAt,
      categories: b.categories.map((bc) => ({ id: bc.category.id, name: bc.category.name, slug: bc.category.slug })),
      tags: b.tags.map((bt) => ({ id: bt.tag.id, name: bt.tag.name, slug: bt.tag.slug })),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    res.json({
      blogs: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("Owner list blogs error:", error);
    res.status(500).json({ error: "Failed to list blogs" });
  }
});

// GET /api/owner/blog/:id — Single blog by ID
ownerRouter.get("/:id", async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
      include: blogInclude,
    });

    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    res.json({
      blog: {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        thumbnailUrl: resolveFileUrl(blog.thumbnailUrl, req),
        authorName: blog.authorName,
        status: blog.status,
        scheduledAt: blog.scheduledAt,
        publishedAt: blog.publishedAt,
        categories: blog.categories.map((bc) => ({ id: bc.category.id, name: bc.category.name, slug: bc.category.slug })),
        tags: blog.tags.map((bt) => ({ id: bt.tag.id, name: bt.tag.name, slug: bt.tag.slug })),
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      },
    });
  } catch (error) {
    console.error("Owner get blog error:", error);
    res.status(500).json({ error: "Failed to get blog" });
  }
});

// POST /api/owner/blog — Create blog
ownerRouter.post("/", validate(schemas.blogCreate), async (req, res) => {
  try {
    const data = req.body;
    const slug = await ensureUniqueSlug(data.slug || generateSlug(data.title));

    const publishedAt = data.status === "PUBLISHED" ? new Date() : data.scheduledAt && data.status === "SCHEDULED" ? null : null;

    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || null,
        thumbnailUrl: data.thumbnailUrl || null,
        authorName: data.authorName || null,
        status: data.status || "DRAFT",
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        categories: data.categoryIds?.length
          ? { create: data.categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
        tags: data.tagIds?.length
          ? { create: data.tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
      },
      include: blogInclude,
    });

    res.status(201).json({ blog: { ...blog, thumbnailUrl: resolveFileUrl(blog.thumbnailUrl, req) } });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create blog" });
  }
});

// PUT /api/owner/blog/:id — Update blog
ownerRouter.put("/:id", validate(schemas.blogUpdate), async (req, res) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    const data = req.body;
    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = await ensureUniqueSlug(data.slug || generateSlug(data.title), id);
    }

    let publishedAt = existing.publishedAt;
    if (data.status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    }

    // Delete existing categories/tags and recreate
    if (data.categoryIds) {
      await prisma.blogCategoryOnBlog.deleteMany({ where: { blogId: id } });
    }
    if (data.tagIds) {
      await prisma.blogTagOnBlog.deleteMany({ where: { blogId: id } });
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        slug,
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.authorName !== undefined && { authorName: data.authorName }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.status === "SCHEDULED" && data.scheduledAt !== undefined
          ? { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }
          : {}),
        publishedAt,
        ...(data.categoryIds?.length
          ? { categories: { create: data.categoryIds.map((categoryId: string) => ({ categoryId })) } }
          : data.categoryIds !== undefined
            ? { categories: { deleteMany: {} } }
            : {}),
        ...(data.tagIds?.length
          ? { tags: { create: data.tagIds.map((tagId: string) => ({ tagId })) } }
          : data.tagIds !== undefined
            ? { tags: { deleteMany: {} } }
            : {}),
      },
      include: blogInclude,
    });

    res.json({ blog: { ...blog, thumbnailUrl: resolveFileUrl(blog.thumbnailUrl, req) } });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update blog" });
  }
});

// DELETE /api/owner/blog/:id — Delete blog
ownerRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

// POST /api/owner/blog/generate-ai — AI generate blog
ownerRouter.post("/generate-ai", validate(schemas.blogGenerate), async (req, res) => {
  try {
    const generated = await generateBlogContent(req.body.instructions);
    res.json({ generated });
  } catch (error) {
    console.error("AI generate blog error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate blog content",
    });
  }
});

// POST /api/owner/blog/upload-thumbnail — Upload thumbnail
ownerRouter.post("/upload-thumbnail", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      res.status(400).json({ error: "Image too large. Maximum 2 MB." });
      return;
    }

    const { fileId, cdnUrl } = await uploadToTelegram(file.buffer, file.originalname);

    // Save to MediaFile library
    await prisma.mediaFile.create({
      data: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileId,
        cdnUrl,
        category: "blog-thumbnails",
      },
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({ url: `${baseUrl}/api/files/${encodeURIComponent(fileId)}` });
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Thumbnail upload failed",
    });
  }
});

// ─── CATEGORY ROUTES ───

// POST /api/owner/blog/categories — Create category
ownerRouter.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    const slug = generateSlug(name);
    const category = await prisma.blogCategory.create({ data: { name: name.trim(), slug } });
    res.status(201).json({ category });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT /api/owner/blog/categories/:id — Update category
ownerRouter.put("/categories/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    const slug = generateSlug(name);
    const category = await prisma.blogCategory.update({
      where: { id: req.params.id },
      data: { name: name.trim(), slug },
    });
    res.json({ category });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE /api/owner/blog/categories/:id — Delete category
ownerRouter.delete("/categories/:id", async (req, res) => {
  try {
    const count = await prisma.blogCategoryOnBlog.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      res.status(400).json({ error: `Cannot delete category with ${count} blog(s) attached` });
      return;
    }
    await prisma.blogCategory.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// ─── TAG ROUTES ───

// POST /api/owner/blog/tags — Create tag
ownerRouter.post("/tags", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Tag name is required" });
      return;
    }
    const slug = generateSlug(name);
    const tag = await prisma.blogTag.create({ data: { name: name.trim(), slug } });
    res.status(201).json({ tag });
  } catch (error) {
    console.error("Create tag error:", error);
    res.status(500).json({ error: "Failed to create tag" });
  }
});

// DELETE /api/owner/blog/tags/:id — Delete tag
ownerRouter.delete("/tags/:id", async (req, res) => {
  try {
    await prisma.blogTag.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete tag error:", error);
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

export { router as blogRoutes, ownerRouter as ownerBlogRoutes };
