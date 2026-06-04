import { type Request, type Response, type NextFunction } from "express";
import { z, type ZodSchema } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}

export const schemas = {
  emailPassword: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),

  mockTestId: z.object({
    mockTestId: z.string().uuid("Invalid test ID"),
  }),

  answers: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().uuid(),
        selectedOption: z.string().nullable(),
      })
    ),
    markedIds: z.array(z.string().uuid()).optional(),
  }),

  roleUpdate: z.object({
    role: z.enum(["USER", "ADMIN"]),
  }),

  contact: z.object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email("Invalid email"),
    subject: z.string().min(1, "Subject is required").max(500),
    message: z.string().min(1, "Message is required").max(5000),
  }),

  adCreate: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(500).nullable().optional(),
    imageUrl: z.string().url("Invalid image URL"),
    ctaText: z.string().max(100).optional(),
    ctaLink: z.string().url("Invalid CTA link"),
    blogUrl: z.string().url("Invalid blog URL").optional().nullable(),
    referenceUrl: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "SCHEDULED"]).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
  }),

  adUpdate: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(500).nullable().optional(),
    imageUrl: z.string().url("Invalid image URL").optional(),
    ctaText: z.string().max(100).optional(),
    ctaLink: z.string().url("Invalid CTA link").optional(),
    blogUrl: z.string().url("Invalid blog URL").optional().nullable(),
    referenceUrl: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "SCHEDULED"]).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
  }),

  adGenerate: z.object({
    instructions: z.string().min(1, "Instructions are required").max(2000),
  }),

  ownerLogin: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  }),

  blogCreate: z.object({
    title: z.string().min(1, "Title is required").max(500),
    content: z.string().min(1, "Content is required"),
    excerpt: z.string().max(1000).optional(),
    thumbnailUrl: z.string().max(2000).optional(),
    authorName: z.string().max(200).optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    categoryIds: z.array(z.string().uuid()).min(1, "At least one category is required"),
    tagIds: z.array(z.string().uuid()).optional(),
  }),

  blogUpdate: z.object({
    title: z.string().min(1).max(500).optional(),
    content: z.string().min(1).optional(),
    excerpt: z.string().max(1000).optional().nullable(),
    thumbnailUrl: z.string().max(2000).optional().nullable(),
    authorName: z.string().max(200).optional().nullable(),
    status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    categoryIds: z.array(z.string().uuid()).optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  }),

  blogGenerate: z.object({
    instructions: z.string().min(1, "Instructions are required").max(2000),
  }),
};
