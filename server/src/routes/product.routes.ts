import { Router } from "express";
import {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from "@/controllers/product.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { validate } from "@/middlewares/validate";
import {
    productIdParamSchema,
    listProductsQuerySchema,
    createProductSchema,
    updateProductSchema,
} from "@/validators/product.validator";

const router = Router();

// Apply auth to all product routes
router.use(authenticate);

// GET /api/products
router.get(
    "/",
    requirePermission("products.read"),
    validate({ query: listProductsQuerySchema }),
    listProducts
);

// GET /api/products/:id
router.get(
    "/:id",
    requirePermission("products.read"),
    validate({ params: productIdParamSchema }),
    getProductById
);

// POST /api/products
router.post(
    "/",
    requirePermission("products.create"),
    validate({ body: createProductSchema }),
    createProduct
);

// PATCH /api/products/:id
router.patch(
    "/:id",
    requirePermission("products.update"),
    validate({
        params: productIdParamSchema,
        body: updateProductSchema,
    }),
    updateProduct
);

// DELETE /api/products/:id
router.delete(
    "/:id",
    requirePermission("products.delete"),
    validate({ params: productIdParamSchema }),
    deleteProduct
);

export default router;
