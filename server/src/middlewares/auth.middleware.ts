import { Request, Response, NextFunction } from "express";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access.",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found.",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};