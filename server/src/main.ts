import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import morgan from "morgan";

import routes from "@/routes";
import { errorHandler } from "@/middlewares/errorHandler";
import { ApiError } from "@/utils/ApiError";

const app = express();

app.use(morgan("dev"));

// Safe CORS handling for frontend origin with credentials
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

    if (origin && (origin === allowedOrigin || origin.startsWith("http://localhost:"))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
    }

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());
app.use(cookieParser());

// Better Auth routes
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// Health endpoints
app.get("/health", (_req, res) => {
    res.json({ success: true, message: "API is healthy." });
});

// Application API routes
app.use("/api", routes);

// 404 Route handler
app.use((req, _res, next) => {
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
});

// Global error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});