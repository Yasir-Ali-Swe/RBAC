import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError";

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    let error = err;

    // Prisma error mapping
    if (err?.code === "P2002") {
        error = ApiError.conflict("A record with this value already exists");
    } else if (err?.code === "P2025") {
        error = ApiError.notFound("Record not found");
    } else if (err?.code === "P2003") {
        error = ApiError.badRequest("Invalid reference: related record does not exist");
    } else if (!(err instanceof ApiError)) {
        error = new ApiError(err.statusCode || 500, err.message || "Internal Server Error");
    }

    const response: Record<string, unknown> = {
        success: false,
        message: error.message,
    };
    if (error.errors) response.errors = error.errors;
    if (process.env.NODE_ENV === "development" && error.statusCode === 500) {
        response.stack = err.stack;
    }

    console.error(`[Error] ${error.statusCode} - ${error.message}`);
    return res.status(error.statusCode).json(response);
};