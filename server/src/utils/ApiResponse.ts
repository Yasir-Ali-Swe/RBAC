import { Response } from "express";

interface Meta {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}

export class ApiResponse {
    static success<T>(
        res: Response,
        data: T,
        message = "Success",
        statusCode = 200,
        meta?: Meta
    ) {
        const payload: Record<string, unknown> = { success: true, message, data };
        if (meta) payload.meta = meta;
        return res.status(statusCode).json(payload);
    }
}