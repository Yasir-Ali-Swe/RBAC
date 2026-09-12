import { z } from "zod";

export const orderIdParamSchema = z.object({
    id: z.string().min(1, "Order ID is required"),
});

export const listOrdersQuerySchema = z.object({
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
    productId: z.string().trim().optional(),
    createdById: z.string().trim().optional(),
});

export const createOrderSchema = z
    .object({
        productId: z
            .string({ required_error: "Product ID is required" })
            .trim()
            .min(1, "Product ID cannot be empty"),
        quantity: z
            .number({ required_error: "Quantity is required" })
            .int("Quantity must be an integer")
            .positive("Quantity must be at least 1"),
    })
    .strict();

export const updateOrderSchema = z
    .object({
        productId: z
            .string()
            .trim()
            .min(1, "Product ID cannot be empty")
            .optional(),
        quantity: z
            .number()
            .int("Quantity must be an integer")
            .positive("Quantity must be at least 1")
            .optional(),
    })
    .strict()
    .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
        message: "At least one field (productId or quantity) must be provided to update",
    });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
