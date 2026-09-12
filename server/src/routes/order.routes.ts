import { Router } from "express";
import {
    listOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
} from "@/controllers/order.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { validate } from "@/middlewares/validate";
import {
    orderIdParamSchema,
    listOrdersQuerySchema,
    createOrderSchema,
    updateOrderSchema,
} from "@/validators/order.validator";

const router = Router();

// Apply auth to all order routes
router.use(authenticate);

// GET /api/orders
router.get(
    "/",
    requirePermission("orders.read"),
    validate({ query: listOrdersQuerySchema }),
    listOrders
);

// GET /api/orders/:id
router.get(
    "/:id",
    requirePermission("orders.read"),
    validate({ params: orderIdParamSchema }),
    getOrderById
);

// POST /api/orders
router.post(
    "/",
    requirePermission("orders.create"),
    validate({ body: createOrderSchema }),
    createOrder
);

// PATCH /api/orders/:id
router.patch(
    "/:id",
    requirePermission("orders.update"),
    validate({
        params: orderIdParamSchema,
        body: updateOrderSchema,
    }),
    updateOrder
);

// DELETE /api/orders/:id
router.delete(
    "/:id",
    requirePermission("orders.delete"),
    validate({ params: orderIdParamSchema }),
    deleteOrder
);

export default router;
