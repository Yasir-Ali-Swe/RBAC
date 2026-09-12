import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    ListUsersQuery,
    UpdateUserInput,
} from "@/validators/user.validator";

type IdParams = { id: string };

const USER_PUBLIC_SELECT = {
    id: true,
    name: true,
    email: true,
    emailVerified: true,
    image: true,
    createdAt: true,
    updatedAt: true,
    roleId: true,
    role: { select: { id: true, name: true } },
} as const;

// ------------------- GET /api/users -------------------
export const listUsers = asyncHandler(
    async (req: Request, res: Response) => {
        const { page, limit, search } = req.query as unknown as ListUsersQuery;
        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: USER_PUBLIC_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({ where }),
        ]);

        return ApiResponse.success(res, users, "Users fetched successfully", 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    }
);

// ------------------- GET /api/users/:id -------------------
export const getUserById = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: USER_PUBLIC_SELECT,
        });

        if (!user) throw ApiError.notFound(`User with id "${id}" not found`);

        return ApiResponse.success(res, user, "User fetched successfully");
    }
);

// ------------------- PATCH /api/users/:id -------------------
export const updateUser = asyncHandler(
    async (req: Request<IdParams, any, UpdateUserInput>, res: Response) => {
        const { id } = req.params;
        const data = req.body;

        const existing = await prisma.user.findUnique({
            where: { id },
            select: { id: true, roleId: true },
        });

        if (!existing) throw ApiError.notFound(`User with id "${id}" not found`);

        if (data.roleId !== undefined && data.roleId !== null) {
            const role = await prisma.role.findUnique({
                where: { id: data.roleId },
                select: { id: true },
            });
            if (!role) throw ApiError.badRequest(`Role with id "${data.roleId}" does not exist`);
        }

        if (req.user?.id === id && data.roleId === null) {
            throw ApiError.badRequest("You cannot remove your own role");
        }

        const updated = await prisma.user.update({
            where: { id },
            data,
            select: USER_PUBLIC_SELECT,
        });

        return ApiResponse.success(res, updated, "User updated successfully");
    }
);

// ------------------- DELETE /api/users/:id -------------------
export const deleteUser = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        if (req.user?.id === id) {
            throw ApiError.badRequest("You cannot delete your own account");
        }

        const existing = await prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) throw ApiError.notFound(`User with id "${id}" not found`);

        const [productCount, orderCount] = await Promise.all([
            prisma.product.count({ where: { createdById: id } }),
            prisma.order.count({ where: { createdById: id } }),
        ]);

        if (productCount > 0 || orderCount > 0) {
            throw ApiError.conflict(
                `Cannot delete user: they have ${productCount} product(s) and ${orderCount} order(s) linked`
            );
        }

        await prisma.user.delete({ where: { id } });

        return ApiResponse.success(res, null, "User deleted successfully");
    }
);