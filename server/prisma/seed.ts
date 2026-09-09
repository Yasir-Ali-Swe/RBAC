import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

const roles = [
    "ADMIN",
    "MANAGER",
    "STAFF",
] as const;

const permissions = [
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "users.invite",

    "products.read",
    "products.create",
    "products.update",
    "products.delete",

    "orders.read",
    "orders.create",
    "orders.update",
    "orders.delete",
] as const;

const rolePermissions = {
    ADMIN: [
        "users.read",
        "users.create",
        "users.update",
        "users.delete",
        "users.invite",

        "products.read",
        "products.create",
        "products.update",
        "products.delete",

        "orders.read",
        "orders.create",
        "orders.update",
        "orders.delete",
    ],

    MANAGER: [
        "users.read",

        "products.read",
        "products.create",
        "products.update",

        "orders.read",
        "orders.create",
        "orders.update",
    ],

    STAFF: [
        "products.read",

        "orders.read",
        "orders.create",
    ],
} as const;

async function seedRoles() {
    const roleMap = new Map<string, string>();

    for (const roleName of roles) {
        const role = await prisma.role.upsert({
            where: {
                name: roleName,
            },
            update: {},
            create: {
                name: roleName,
            },
        });

        roleMap.set(roleName, role.id);

        console.log(`Role ready: ${roleName}`);
    }

    return roleMap;
}

async function seedPermissions() {
    const permissionMap = new Map<string, string>();

    for (const permissionName of permissions) {
        const permission = await prisma.permission.upsert({
            where: {
                name: permissionName,
            },
            update: {},
            create: {
                name: permissionName,
            },
        });

        permissionMap.set(permissionName, permission.id);

        console.log(`Permission ready: ${permissionName}`);
    }

    return permissionMap;
}

async function seedRolePermissions(
    roleMap: Map<string, string>,
    permissionMap: Map<string, string>
) {
    for (const [roleName, permissionNames] of Object.entries(
        rolePermissions
    )) {
        const roleId = roleMap.get(roleName);

        if (!roleId) {
            throw new Error(`Role not found: ${roleName}`);
        }

        for (const permissionName of permissionNames) {
            const permissionId = permissionMap.get(permissionName);

            if (!permissionId) {
                throw new Error(
                    `Permission not found: ${permissionName}`
                );
            }

            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId,
                        permissionId,
                    },
                },
                update: {},
                create: {
                    roleId,
                    permissionId,
                },
            });
        }

        console.log(`Permissions assigned to: ${roleName}`);
    }
}

async function seedAdmin(roleMap: Map<string, string>) {
    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName || !adminEmail || !adminPassword) {
        throw new Error(
            "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env"
        );
    }

    const adminRoleId = roleMap.get("ADMIN");

    if (!adminRoleId) {
        throw new Error("ADMIN role not found.");
    }

    // Check if the admin already exists.
    let admin = await prisma.user.findUnique({
        where: {
            email: adminEmail,
        },
        select: {
            id: true,
            email: true,
            roleId: true,
        },
    });

    // Create the admin through Better Auth if it doesn't exist.
    if (!admin) {
        const result = await auth.api.signUpEmail({
            body: {
                name: adminName,
                email: adminEmail,
                password: adminPassword,
            },
        });

        if (!result?.user) {
            throw new Error("Failed to create admin user through Better Auth.");
        }

        admin = await prisma.user.findUnique({
            where: {
                id: result.user.id,
            },
            select: {
                id: true,
                email: true,
                roleId: true,
            },
        });

        if (!admin) {
            throw new Error(
                "Admin was created but could not be found in the database."
            );
        }

        console.log(`Admin user created: ${adminEmail}`);
    } else {
        console.log(`Admin user already exists: ${adminEmail}`);
    }

    // Make sure the admin has the ADMIN role.
    if (admin.roleId !== adminRoleId) {
        await prisma.user.update({
            where: {
                id: admin.id,
            },
            data: {
                roleId: adminRoleId,
            },
        });

        console.log(`ADMIN role assigned to: ${adminEmail}`);
    } else {
        console.log(`ADMIN role already assigned to: ${adminEmail}`);
    }
}

async function main() {
    console.log("🌱 Starting database seed...\n");

    const roleMap = await seedRoles();

    console.log("");

    const permissionMap = await seedPermissions();

    console.log("");

    await seedRolePermissions(roleMap, permissionMap);

    console.log("");

    await seedAdmin(roleMap);

    console.log("\n✅ Database seed completed successfully.");
}

main()
    .catch((error) => {
        console.error("\n❌ Database seed failed:");
        console.error(error);

        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });