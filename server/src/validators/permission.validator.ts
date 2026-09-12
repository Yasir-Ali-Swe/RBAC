import { z } from "zod";

export const permissionIdParamSchema = z.object({
    id: z.string().min(1, "Permission ID is required"),
});

export const listPermissionsQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v: string | undefined) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v: string | undefined) => {
            const n = v ? parseInt(v, 10) : 50;
            return Math.min(100, Math.max(1, isNaN(n) ? 50 : n));
        }),
    search: z.string().trim().optional(),
});

export type ListPermissionsQuery = z.infer<typeof listPermissionsQuerySchema>;
