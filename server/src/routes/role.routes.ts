import { Router } from "express";
import {
    listRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    updateRolePermissions,
} from "@/controllers/role.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/permission.middleware";
import { validate } from "@/middlewares/validate";
import {
    roleIdParamSchema,
    listRolesQuerySchema,
    createRoleSchema,
    updateRoleSchema,
    updateRolePermissionsSchema,
} from "@/validators/role.validator";

const router = Router();

// Apply authentication and ADMIN-only check to all role routes
router.use(authenticate, requireAdmin);

// GET /api/roles
router.get(
    "/",
    validate({ query: listRolesQuerySchema }),
    listRoles
);

// GET /api/roles/:id
router.get(
    "/:id",
    validate({ params: roleIdParamSchema }),
    getRoleById
);

// POST /api/roles
router.post(
    "/",
    validate({ body: createRoleSchema }),
    createRole
);

// PATCH /api/roles/:id
router.patch(
    "/:id",
    validate({ params: roleIdParamSchema, body: updateRoleSchema }),
    updateRole
);

// DELETE /api/roles/:id
router.delete(
    "/:id",
    validate({ params: roleIdParamSchema }),
    deleteRole
);

// GET /api/roles/:id/permissions
router.get(
    "/:id/permissions",
    validate({ params: roleIdParamSchema }),
    getRolePermissions
);

// PUT /api/roles/:id/permissions
router.put(
    "/:id/permissions",
    validate({
        params: roleIdParamSchema,
        body: updateRolePermissionsSchema,
    }),
    updateRolePermissions
);

export default router;
