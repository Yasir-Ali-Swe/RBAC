import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})
