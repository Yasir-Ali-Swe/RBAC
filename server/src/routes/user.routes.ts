import { Router } from "express";

import {
    deleteUser,
    getUserById,
    listUsers,
    updateUser,
} from "@/controllers/user.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { validate } from "@/middlewares/validate";
import {
    listUsersQuerySchema,
    updateUserSchema,
    userIdParamSchema,
} from "@/validators/user.validator";

const router = Router();

// Apply auth to all user routes
router.use(authenticate);

// GET /api/users
router.get(
    "/",
    requirePermission("users.read"),
    validate({ query: listUsersQuerySchema }),
    listUsers
);

// GET /api/users/:id
router.get(
    "/:id",
    requirePermission("users.read"),
    validate({ params: userIdParamSchema }),
    getUserById
);

// PATCH /api/users/:id
router.patch(
    "/:id",
    requirePermission("users.update"),
    validate({ params: userIdParamSchema, body: updateUserSchema }),
    updateUser
);

// DELETE /api/users/:id
router.delete(
    "/:id",
    requirePermission("users.delete"),
    validate({ params: userIdParamSchema }),
    deleteUser
);

export default router;