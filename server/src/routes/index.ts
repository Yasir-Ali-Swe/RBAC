import { Router } from "express";

import userRoutes from "./user.routes";
import invitationRoutes from "./invitation.routes";
import roleRoutes from "./role.routes";
import permissionRoutes from "./permission.routes";
import productRoutes from "./product.routes";
import orderRoutes from "./order.routes";
import { ApiResponse } from "@/utils/ApiResponse";

const router = Router();

// Health check endpoint: GET /api/health
router.get("/health", (_req, res) => {
    return ApiResponse.success(res, { status: "healthy" }, "API is healthy.");
});

router.use("/users", userRoutes);
router.use("/invitations", invitationRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

export default router;