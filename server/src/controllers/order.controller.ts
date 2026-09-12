import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    CreateOrderInput,
    UpdateOrderInput,
    ListOrdersQuery,
} from "@/validators/order.validator";

type IdParams = { id: string };

const ORDER_INCLUDE = {
    product: {
        select: {
            id: true,
            name: true,
            price: true,
        },
    },
    createdBy: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} as const;

// ------------------- GET /api/orders -------------------
export const listOrders = asyncHandler(
    async (req: Request, res: Response) => {
        const { page = 1, limit = 20, productId, createdById } =
            req.query as unknown as ListOrdersQuery;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (productId) {
            where.productId = productId;
        }

        if (createdById) {
            where.createdById = createdById;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: ORDER_INCLUDE,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.order.count({ where }),
        ]);

        return ApiResponse.success(res, orders, "Orders fetched successfully", 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    }
);

// ------------------- GET /api/orders/:id -------------------
export const getOrderById = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: ORDER_INCLUDE,
        });

        if (!order) {
            throw ApiError.notFound(`Order with id "${id}" not found`);
        }

        return ApiResponse.success(res, order, "Order fetched successfully");
    }
);

// ------------------- POST /api/orders -------------------
export const createOrder = asyncHandler(
    async (req: Request<any, any, CreateOrderInput>, res: Response) => {
        const { productId, quantity } = req.body;
        const createdById = req.user!.id;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, price: true },
        });

        if (!product) {
            throw ApiError.notFound(`Product with id "${productId}" not found`);
        }

        // Server-side authoritative price calculation
        const totalPrice = Number((product.price * quantity).toFixed(2));

        const order = await prisma.order.create({
            data: {
                productId,
                quantity,
                totalPrice,
                createdById,
            },
            include: ORDER_INCLUDE,
        });

        return ApiResponse.success(res, order, "Order created successfully", 201);
    }
);

// ------------------- PATCH /api/orders/:id -------------------
export const updateOrder = asyncHandler(
    async (req: Request<IdParams, any, UpdateOrderInput>, res: Response) => {
        const { id } = req.params;
        const { productId, quantity } = req.body;

        const existingOrder = await prisma.order.findUnique({
            where: { id },
            select: { id: true, productId: true, quantity: true },
        });

        if (!existingOrder) {
            throw ApiError.notFound(`Order with id "${id}" not found`);
        }

        const targetProductId = productId || existingOrder.productId;
        const targetQuantity = quantity !== undefined ? quantity : existingOrder.quantity;

        const product = await prisma.product.findUnique({
            where: { id: targetProductId },
            select: { id: true, price: true },
        });

        if (!product) {
            throw ApiError.notFound(`Product with id "${targetProductId}" not found`);
        }

        // Recalculate totalPrice server-side
        const totalPrice = Number((product.price * targetQuantity).toFixed(2));

        const updated = await prisma.order.update({
            where: { id },
            data: {
                ...(productId ? { productId } : {}),
                ...(quantity !== undefined ? { quantity } : {}),
                totalPrice,
            },
            include: ORDER_INCLUDE,
        });

        return ApiResponse.success(res, updated, "Order updated successfully");
    }
);

// ------------------- DELETE /api/orders/:id -------------------
export const deleteOrder = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;

        const existing = await prisma.order.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw ApiError.notFound(`Order with id "${id}" not found`);
        }

        await prisma.order.delete({ where: { id } });

        return ApiResponse.success(res, null, "Order deleted successfully");
    }
);
