import { z } from "zod";

export const userIdParamSchema = z.object({
    id: z.string().min(1, "User ID is required"),
});

export const listUsersQuerySchema = z.object({
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
});

export const updateUserSchema = z
    .object({
        name: z.string().min(1, "Name cannot be empty").optional(),
        email: z.string().email("Invalid email address").optional(),
        image: z.string().url("Invalid image URL").nullable().optional(),
        emailVerified: z.boolean().optional(),
        roleId: z.string().min(1).nullable().optional(),
    })
    .strict()
    .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
        message: "At least one field must be provided to update",
    });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;