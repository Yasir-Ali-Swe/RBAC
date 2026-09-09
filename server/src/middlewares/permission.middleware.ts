import { Request, Response, NextFunction } from "express";

import { prisma } from "@/lib/prisma";
import { PermissionName } from "@/types/rbac.types";

export const requirePermission = (
    permissionName: PermissionName
) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized access.",
                });
            }

            const rolePermission =
                await prisma.rolePermission.findFirst({
                    where: {
                        roleId: user.roleId,
                        permission: {
                            name: permissionName,
                        },
                    },
                    select: {
                        id: true,
                    },
                });

            if (!rolePermission) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have permission to perform this action.",
                });
            }

            next();
        } catch (error) {
            console.error("Permission middleware error:", error);

            return res.status(500).json({
                success: false,
                message: "Internal server error.",
            });
        }
    };
};