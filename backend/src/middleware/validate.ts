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

// Common validation schemas
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
  }),

  roleUpdate: z.object({
    role: z.enum(["USER", "ADMIN"]),
  }),
};
