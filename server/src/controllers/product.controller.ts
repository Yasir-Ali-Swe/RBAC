import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    CreateProductInput,
    UpdateProductInput,
    ListProductsQuery,
} from "@/validators/product.validator";

type IdParams = { id: string };

const PRODUCT_INCLUDE = {
    createdBy: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} as const;

// ------------------- GET /api/products -------------------
export const listProducts = asyncHandler(
    async (req: Request, res: Response) => {
        const { page = 1, limit = 20, search, minPrice, maxPrice } =
            req.query as unknown as ListProductsQuery;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (search) {
            where.name = { contains: search, mode: "insensitive" as const };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: PRODUCT_INCLUDE,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.product.count({ where }),
        ]);

        return ApiResponse.success(res, products, "Products fetched successfully", 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    }
);

// ------------------- GET /api/products/:id -------------------
export const getProductById = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: PRODUCT_INCLUDE,
        });

        if (!product) {
            throw ApiError.notFound(`Product with id "${id}" not found`);
        }

        return ApiResponse.success(res, product, "Product fetched successfully");
    }
);

// ------------------- POST /api/products -------------------
export const createProduct = asyncHandler(
    async (req: Request<any, any, CreateProductInput>, res: Response) => {
        const { name, price } = req.body;
        const createdById = req.user!.id;

        const product = await prisma.product.create({
            data: {
                name,
                price,
                createdById,
            },
            include: PRODUCT_INCLUDE,
        });

        return ApiResponse.success(res, product, "Product created successfully", 201);
    }
);

// ------------------- PATCH /api/products/:id -------------------
export const updateProduct = asyncHandler(
    async (req: Request<IdParams, any, UpdateProductInput>, res: Response) => {
        const { id } = req.params;
        const data = req.body;

        const existing = await prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw ApiError.notFound(`Product with id "${id}" not found`);
        }

        const updated = await prisma.product.update({
            where: { id },
            data,
            include: PRODUCT_INCLUDE,
        });

        return ApiResponse.success(updated ? res : res, updated, "Product updated successfully");
    }
);

// ------------------- DELETE /api/products/:id -------------------
export const deleteProduct = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const existing = await prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw ApiError.notFound(`Product with id "${id}" not found`);
        }

        const orderCount = await prisma.order.count({
            where: { productId: id },
        });

        if (orderCount > 0) {
            throw ApiError.conflict(
                `Cannot delete product: it is associated with ${orderCount} order(s)`
            );
        }

        await prisma.product.delete({ where: { id } });

        return ApiResponse.success(res, null, "Product deleted successfully");
    }
);
