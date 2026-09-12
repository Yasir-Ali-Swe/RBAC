import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    CreateRoleInput,
    UpdateRoleInput,
    UpdateRolePermissionsInput,
    ListRolesQuery,
} from "@/validators/role.validator";

type IdParams = { id: string };

const SYSTEM_ROLES = ["ADMIN", "MANAGER", "STAFF"] as const;

// ------------------- GET /api/roles -------------------
export const listRoles = asyncHandler(
    async (req: Request, res: Response) => {
        const { page = 1, limit = 20, search } = req.query as unknown as ListRolesQuery;
        const skip = (page - 1) * limit;

        const where = search
            ? { name: { contains: search, mode: "insensitive" as const } }
            : {};

        const [roles, total] = await Promise.all([
            prisma.role.findMany({
                where,
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.role.count({ where }),
        ]);

        const formattedRoles = roles.map((role) => ({
            id: role.id,
            name: role.name,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            userCount: role._count.users,
            permissions: role.permissions.map((rp) => ({
                id: rp.permission.id,
                name: rp.permission.name,
            })),
        }));

        return ApiResponse.success(res, formattedRoles, "Roles fetched successfully", 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    }
);

// ------------------- GET /api/roles/:id -------------------
export const getRoleById = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        if (!role) {
            throw ApiError.notFound(`Role with id "${id}" not found`);
        }

        const formattedRole = {
            id: role.id,
            name: role.name,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            userCount: role._count.users,
            permissions: role.permissions.map((rp) => ({
                id: rp.permission.id,
                name: rp.permission.name,
            })),
        };

        return ApiResponse.success(res, formattedRole, "Role fetched successfully");
    }
);

// ------------------- POST /api/roles -------------------
export const createRole = asyncHandler(
    async (req: Request<any, any, CreateRoleInput>, res: Response) => {
        const { name } = req.body;

        const existing = await prisma.role.findUnique({
            where: { name },
            select: { id: true },
        });

        if (existing) {
            throw ApiError.conflict(`Role with name "${name}" already exists`);
        }

        const role = await prisma.role.create({
            data: { name },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return ApiResponse.success(res, role, "Role created successfully", 201);
    }
);

// ------------------- PATCH /api/roles/:id -------------------
export const updateRole = asyncHandler(
    async (req: Request<IdParams, any, UpdateRoleInput>, res: Response) => {
        const { id } = req.params;
        const { name } = req.body;

        const role = await prisma.role.findUnique({
            where: { id },
            select: { id: true, name: true },
        });

        if (!role) {
            throw ApiError.notFound(`Role with id "${id}" not found`);
        }

        if (SYSTEM_ROLES.includes(role.name as any)) {
            throw ApiError.badRequest(`System role "${role.name}" cannot be renamed`);
        }

        const duplicate = await prisma.role.findFirst({
            where: {
                name,
                NOT: { id },
            },
            select: { id: true },
        });

        if (duplicate) {
            throw ApiError.conflict(`Role with name "${name}" already exists`);
        }

        const updated = await prisma.role.update({
            where: { id },
            data: { name },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return ApiResponse.success(res, updated, "Role updated successfully");
    }
);

// ------------------- DELETE /api/roles/:id -------------------
export const deleteRole = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const role = await prisma.role.findUnique({
            where: { id },
            select: { id: true, name: true },
        });

        if (!role) {
            throw ApiError.notFound(`Role with id "${id}" not found`);
        }

        if (SYSTEM_ROLES.includes(role.name as any)) {
            throw ApiError.badRequest(`System role "${role.name}" cannot be deleted`);
        }

        const [userCount, invitationCount] = await Promise.all([
            prisma.user.count({ where: { roleId: id } }),
            prisma.invitation.count({ where: { roleId: id, status: "PENDING" } }),
        ]);

        if (userCount > 0) {
            throw ApiError.conflict(`Cannot delete role: ${userCount} user(s) are assigned to it`);
        }

        if (invitationCount > 0) {
            throw ApiError.conflict(`Cannot delete role: ${invitationCount} pending invitation(s) use it`);
        }

        await prisma.role.delete({ where: { id } });

        return ApiResponse.success(res, null, "Role deleted successfully");
    }
);

// ------------------- GET /api/roles/:id/permissions -------------------
export const getRolePermissions = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        if (!role) {
            throw ApiError.notFound(`Role with id "${id}" not found`);
        }

        const permissions = role.permissions.map((rp) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            createdAt: rp.permission.createdAt,
        }));

        return ApiResponse.success(res, permissions, "Role permissions fetched successfully");
    }
);

// ------------------- PUT /api/roles/:id/permissions -------------------
export const updateRolePermissions = asyncHandler(
    async (req: Request<IdParams, any, UpdateRolePermissionsInput>, res: Response) => {
        const { id } = req.params;
        const { permissionIds } = req.body;

        const role = await prisma.role.findUnique({
            where: { id },
            select: { id: true, name: true },
        });

        if (!role) {
            throw ApiError.notFound(`Role with id "${id}" not found`);
        }

        const uniquePermissionIds: string[] = Array.from(new Set(permissionIds));

        if (uniquePermissionIds.length > 0) {
            const foundPermissions = await prisma.permission.findMany({
                where: {
                    id: { in: uniquePermissionIds },
                },
                select: { id: true },
            });

            if (foundPermissions.length !== uniquePermissionIds.length) {
                const foundIds = new Set(foundPermissions.map((p) => p.id));
                const invalidIds = uniquePermissionIds.filter((pid) => !foundIds.has(pid));
                throw ApiError.badRequest(`Invalid permission ID(s): ${invalidIds.join(", ")}`);
            }
        }

        // Execute atomic replacement in a transaction
        await prisma.$transaction([
            prisma.rolePermission.deleteMany({
                where: { roleId: id },
            }),
            ...(uniquePermissionIds.length > 0
                ? [
                    prisma.rolePermission.createMany({
                        data: uniquePermissionIds.map((permissionId) => ({
                            roleId: id,
                            permissionId,
                        })),
                    }),
                ]
                : []),
        ]);

        const updatedRole = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        const formatted = {
            id: updatedRole!.id,
            name: updatedRole!.name,
            permissions: updatedRole!.permissions.map((rp) => ({
                id: rp.permission.id,
                name: rp.permission.name,
            })),
        };

        return ApiResponse.success(res, formatted, "Role permissions updated successfully");
    }
);
