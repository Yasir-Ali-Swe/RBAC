import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "@/utils/ApiError";

type Schemas = {
    body?: z.ZodType<any>;
    params?: z.ZodType<any>;
    query?: z.ZodType<any>;
};

export const validate =
    (schemas: Schemas) =>
        (req: Request, _res: Response, next: NextFunction) => {
            try {
                if (schemas.params) {
                    const parsed = schemas.params.parse(req.params);
                    Object.defineProperty(req, "params", {
                        value: parsed,
                        writable: true,
                        configurable: true,
                    });
                }
                if (schemas.query) {
                    const parsed = schemas.query.parse(req.query);
                    Object.defineProperty(req, "query", {
                        value: parsed,
                        writable: true,
                        configurable: true,
                    });
                }
                if (schemas.body) {
                    req.body = schemas.body.parse(req.body);
                }
                next();
            } catch (error: any) {
                if (error instanceof z.ZodError) {
                    return next(
                        ApiError.unprocessable(
                            "Validation failed",
                            error.flatten().fieldErrors as unknown as Record<string, string[]>
                        )
                    );
                }
                next(error);
            }
        };