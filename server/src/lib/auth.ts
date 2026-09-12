import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";;

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:5001",
    ],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
});