import { z } from "zod";

export const roleIdParamSchema = z.object({
    id: z.string().min(1, "Role ID is required"),
});

export const listRolesQuerySchema = z.object({
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

export const createRoleSchema = z
    .object({
        name: z
            .string({ required_error: "Role name is required" })
            .trim()
            .min(2, "Role name must be at least 2 characters")
            .max(50, "Role name must not exceed 50 characters")
            .toUpperCase(),
    })
    .strict();

export const updateRoleSchema = z
    .object({
        name: z
            .string({ required_error: "Role name is required" })
            .trim()
            .min(2, "Role name must be at least 2 characters")
            .max(50, "Role name must not exceed 50 characters")
            .toUpperCase(),
    })
    .strict();

export const updateRolePermissionsSchema = z
    .object({
        permissionIds: z
            .array(z.string().min(1, "Permission ID cannot be empty"), {
                required_error: "permissionIds array is required",
            }),
    })
    .strict();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
