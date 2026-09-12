import { Router } from "express";
import {
    listPermissions,
    getPermissionById,
} from "@/controllers/permission.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/permission.middleware";
import { validate } from "@/middlewares/validate";
import {
    permissionIdParamSchema,
    listPermissionsQuerySchema,
} from "@/validators/permission.validator";

const router = Router();

// Apply authentication and ADMIN-only check to all permission routes
router.use(authenticate, requireAdmin);

// GET /api/permissions
router.get(
    "/",
    validate({ query: listPermissionsQuerySchema }),
    listPermissions
);

// GET /api/permissions/:id
router.get(
    "/:id",
    validate({ params: permissionIdParamSchema }),
    getPermissionById
);

export default router;
