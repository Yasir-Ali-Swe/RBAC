import { User } from "@/lib/generated/prisma/client";

export type AuthUser = Pick<
    User,
    "id" | "name" | "email" | "roleId"
>;

