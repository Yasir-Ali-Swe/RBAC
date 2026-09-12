import { z } from "zod";

export const productIdParamSchema = z.object({
    id: z.string().min(1, "Product ID is required"),
});

export const listProductsQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v: string | undefined) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v: string | undefined) => {
            const n = v ? parseInt(v, 10) : 20;
            return Math.min(100, Math.max(1, isNaN(n) ? 20 : n));
        }),
    search: z.string().trim().optional(),
    minPrice: z
        .string()
        .optional()
        .transform((v: string | undefined) => (v ? parseFloat(v) : undefined)),
    maxPrice: z
        .string()
        .optional()
        .transform((v: string | undefined) => (v ? parseFloat(v) : undefined)),
});

export const createProductSchema = z
    .object({
        name: z
            .string({ required_error: "Product name is required" })
            .trim()
            .min(1, "Product name cannot be empty")
            .max(255, "Product name cannot exceed 255 characters"),
        price: z
            .number({ required_error: "Price is required" })
            .positive("Price must be a positive number"),
    })
    .strict();

export const updateProductSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Product name cannot be empty")
            .max(255, "Product name cannot exceed 255 characters")
            .optional(),
        price: z
            .number()
            .positive("Price must be a positive number")
            .optional(),
    })
    .strict()
    .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
        message: "At least one field (name or price) must be provided to update",
    });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
