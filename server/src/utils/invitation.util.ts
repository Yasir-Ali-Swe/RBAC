import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ApiError } from "@/utils/ApiError";
import { addInvitationEmailJob } from "@/lib/email.queue";
import {
    CreateInvitationInput,
    ListInvitationsQuery,
} from "@/validators/invitation.validator";

export const INVITATION_SAFE_SELECT = {
    id: true,
    name: true,
    email: true,
    status: true,
    roleId: true,
    role: {
        select: {
            id: true,
            name: true,
        },
    },
    createdAt: true,
    updatedAt: true,
    expiresAt: true,
    acceptedAt: true,
} as const;

export const generateInvitationToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};

export const getInvitationExpiryDate = (): Date => {
    const hours = Number(process.env.INVITATION_EXPIRY_HOURS) || 24;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
};

export const createInvitationService = async (data: CreateInvitationInput) => {
    const { name, email, roleId } = data;

    // 1. Verify role exists
    const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, name: true },
    });

    if (!role) {
        throw ApiError.badRequest(`Role with id "${roleId}" does not exist`);
    }

    // 2. Check if a User already exists with this email
    const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existingUser) {
        throw ApiError.conflict(`A user with email "${email}" already exists`);
    }

    // 3. Check if a PENDING invitation already exists for this email
    const existingInvitation = await prisma.invitation.findFirst({
        where: {
            email,
            status: "PENDING",
        },
    });

    if (existingInvitation) {
        // If it's expired, update it to EXPIRED
        if (new Date(existingInvitation.expiresAt) <= new Date()) {
            await prisma.invitation.update({
                where: { id: existingInvitation.id },
                data: { status: "EXPIRED" },
            });
        } else {
            throw ApiError.conflict(
                `An active pending invitation already exists for email "${email}". Please resend or revoke the existing invitation.`
            );
        }
    }

    // 4. Create new invitation
    const token = generateInvitationToken();
    const expiresAt = getInvitationExpiryDate();

    const invitation = await prisma.invitation.create({
        data: {
            name,
            email,
            roleId,
            token,
            expiresAt,
            status: "PENDING",
        },
        select: INVITATION_SAFE_SELECT,
    });

    // 5. Enqueue background email job
    await addInvitationEmailJob(invitation.id);

    return invitation;
};

export const listInvitationsService = async (query: ListInvitationsQuery) => {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const [invitations, total] = await Promise.all([
        prisma.invitation.findMany({
            where,
            select: INVITATION_SAFE_SELECT,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.invitation.count({ where }),
    ]);

    return {
        invitations,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getInvitationByIdService = async (id: string) => {
    const invitation = await prisma.invitation.findUnique({
        where: { id },
        select: INVITATION_SAFE_SELECT,
    });

    if (!invitation) {
        throw ApiError.notFound(`Invitation with id "${id}" not found`);
    }

    return invitation;
};

export const verifyInvitationService = async (token: string) => {
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!invitation) {
        throw ApiError.notFound("Invalid invitation token");
    }

    if (invitation.status === "REVOKED") {
        throw ApiError.badRequest("This invitation has been revoked");
    }

    if (invitation.status === "ACCEPTED") {
        throw ApiError.conflict("This invitation has already been accepted");
    }

    if (invitation.status === "EXPIRED" || new Date(invitation.expiresAt) <= new Date()) {
        if (invitation.status === "PENDING") {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: "EXPIRED" },
            });
        }
        throw ApiError.badRequest("This invitation has expired");
    }

    return {
        name: invitation.name,
        email: invitation.email,
        role: invitation.role.name,
        expiresAt: invitation.expiresAt,
    };
};

export const acceptInvitationService = async (token: string, password: string) => {
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!invitation) {
        throw ApiError.notFound("Invalid invitation token");
    }

    if (invitation.status === "REVOKED") {
        throw ApiError.badRequest("This invitation has been revoked");
    }

    if (invitation.status === "ACCEPTED") {
        throw ApiError.conflict("This invitation has already been accepted");
    }

    if (invitation.status === "EXPIRED" || new Date(invitation.expiresAt) <= new Date()) {
        if (invitation.status === "PENDING") {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: "EXPIRED" },
            });
        }
        throw ApiError.badRequest("This invitation has expired");
    }

    // Verify role still exists
    if (!invitation.role) {
        throw ApiError.badRequest("The role assigned to this invitation no longer exists");
    }

    // Verify email is not already taken
    const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
        select: { id: true },
    });

    if (existingUser) {
        throw ApiError.conflict(`A user with email "${invitation.email}" already exists`);
    }

    // 1. Create authentication account using Better Auth server API
    const authResult = await auth.api.signUpEmail({
        body: {
            name: invitation.name,
            email: invitation.email,
            password,
        },
    });

    if (!authResult?.user?.id) {
        throw ApiError.badRequest("Failed to create authentication account");
    }

    const createdUserId = authResult.user.id;

    // 2. Assign the authoritative roleId to the new user and mark invitation as ACCEPTED
    try {
        await prisma.$transaction([
            prisma.user.update({
                where: { id: createdUserId },
                data: { roleId: invitation.roleId },
            }),
            prisma.invitation.update({
                where: { id: invitation.id },
                data: {
                    status: "ACCEPTED",
                    acceptedAt: new Date(),
                },
            }),
        ]);
    } catch (error) {
        console.error("Failed to complete role assignment and invitation finalization:", error);
        // Attempt cleanup if transaction failed
        try {
            await prisma.user.delete({ where: { id: createdUserId } });
        } catch (cleanupErr) {
            console.error("Failed to cleanup user after failed invitation acceptance:", cleanupErr);
        }
        throw ApiError.badRequest("Failed to complete invitation acceptance. Please contact administrator.");
    }

    return {
        name: invitation.name,
        email: invitation.email,
        role: invitation.role.name,
    };
};

export const resendInvitationService = async (id: string) => {
    const invitation = await prisma.invitation.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            roleId: true,
        },
    });

    if (!invitation) {
        throw ApiError.notFound(`Invitation with id "${id}" not found`);
    }

    if (invitation.status === "ACCEPTED") {
        throw ApiError.badRequest("Cannot resend an already accepted invitation");
    }

    const newToken = generateInvitationToken();
    const newExpiresAt = getInvitationExpiryDate();

    const updated = await prisma.invitation.update({
        where: { id },
        data: {
            token: newToken,
            expiresAt: newExpiresAt,
            status: "PENDING",
        },
        select: INVITATION_SAFE_SELECT,
    });

    // Enqueue background email job
    await addInvitationEmailJob(updated.id);

    return updated;
};

export const revokeInvitationService = async (id: string) => {
    const invitation = await prisma.invitation.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
        },
    });

    if (!invitation) {
        throw ApiError.notFound(`Invitation with id "${id}" not found`);
    }

    if (invitation.status === "ACCEPTED") {
        throw ApiError.badRequest("Cannot revoke an already accepted invitation");
    }

    if (invitation.status === "REVOKED") {
        const revoked = await prisma.invitation.findUnique({
            where: { id },
            select: INVITATION_SAFE_SELECT,
        });
        return revoked;
    }

    const updated = await prisma.invitation.update({
        where: { id },
        data: {
            status: "REVOKED",
        },
        select: INVITATION_SAFE_SELECT,
    });

    return updated;
};
