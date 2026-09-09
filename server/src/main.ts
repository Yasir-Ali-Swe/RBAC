import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import morgan from "morgan";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.all("/api/auth/{*splat}", toNodeHandler(auth));

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})
