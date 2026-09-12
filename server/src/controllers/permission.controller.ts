import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { ListPermissionsQuery } from "@/validators/permission.validator";

type IdParams = { id: string };

// ------------------- GET /api/permissions -------------------
export const listPermissions = asyncHandler(
    async (req: Request, res: Response) => {
        const { page = 1, limit = 50, search } = req.query as unknown as ListPermissionsQuery;
        const skip = (page - 1) * limit;

        const where = search
            ? { name: { contains: search, mode: "insensitive" as const } }
            : {};

        const [permissions, total] = await Promise.all([
            prisma.permission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.permission.count({ where }),
        ]);

        return ApiResponse.success(res, permissions, "Permissions fetched successfully", 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    }
);

// ------------------- GET /api/permissions/:id -------------------
export const getPermissionById = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const permission = await prisma.permission.findUnique({
            where: { id },
        });

        if (!permission) {
            throw ApiError.notFound(`Permission with id "${id}" not found`);
        }

        return ApiResponse.success(res, permission, "Permission fetched successfully");
    }
);
