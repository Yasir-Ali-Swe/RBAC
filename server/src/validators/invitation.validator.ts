import { z } from "zod";

export const invitationIdParamSchema = z.object({
    id: z.string().min(1, "Invitation ID is required"),
});

export const invitationTokenParamSchema = z.object({
    token: z.string().min(1, "Invitation token is required"),
});

export const listInvitationsQuerySchema = z.object({
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
    status: z
        .enum(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"])
        .optional(),
    search: z.string().trim().optional(),
});

export const createInvitationSchema = z
    .object({
        name: z
            .string({ required_error: "Name is required" })
            .trim()
            .min(1, "Name cannot be empty"),
        email: z
            .string({ required_error: "Email is required" })
            .trim()
            .toLowerCase()
            .email("Invalid email address"),
        roleId: z
            .string({ required_error: "Role ID is required" })
            .trim()
            .min(1, "Role ID cannot be empty"),
    })
    .strict();

export const acceptInvitationSchema = z
    .object({
        password: z
            .string({ required_error: "Password is required" })
            .min(8, "Password must be at least 8 characters"),
        confirmPassword: z
            .string({ required_error: "Confirm password is required" })
            .min(8, "Confirm password must be at least 8 characters"),
    })
    .strict()
    .refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;
