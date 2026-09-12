import { Router } from "express";
import {
    createInvitation,
    listInvitations,
    getInvitationById,
    verifyInvitation,
    acceptInvitation,
    resendInvitation,
    revokeInvitation,
} from "@/controllers/invitation.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { validate } from "@/middlewares/validate";
import {
    createInvitationSchema,
    acceptInvitationSchema,
    listInvitationsQuerySchema,
    invitationIdParamSchema,
    invitationTokenParamSchema,
} from "@/validators/invitation.validator";

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/invitations/verify/:token
router.get(
    "/verify/:token",
    validate({ params: invitationTokenParamSchema }),
    verifyInvitation
);

// POST /api/invitations/accept/:token
router.post(
    "/accept/:token",
    validate({
        params: invitationTokenParamSchema,
        body: acceptInvitationSchema,
    }),
    acceptInvitation
);

// ==================== PROTECTED ROUTES ====================

// POST /api/invitations
router.post(
    "/",
    authenticate,
    requirePermission("users.invite"),
    validate({ body: createInvitationSchema }),
    createInvitation
);

// GET /api/invitations
router.get(
    "/",
    authenticate,
    requirePermission("users.invite"),
    validate({ query: listInvitationsQuerySchema }),
    listInvitations
);

// GET /api/invitations/:id
router.get(
    "/:id",
    authenticate,
    requirePermission("users.invite"),
    validate({ params: invitationIdParamSchema }),
    getInvitationById
);

// POST /api/invitations/:id/resend
router.post(
    "/:id/resend",
    authenticate,
    requirePermission("users.invite"),
    validate({ params: invitationIdParamSchema }),
    resendInvitation
);

// PATCH /api/invitations/:id/revoke
router.patch(
    "/:id/revoke",
    authenticate,
    requirePermission("users.invite"),
    validate({ params: invitationIdParamSchema }),
    revokeInvitation
);

export default router;
