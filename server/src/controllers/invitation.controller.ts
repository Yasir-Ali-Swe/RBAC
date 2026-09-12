import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    CreateInvitationInput,
    AcceptInvitationInput,
    ListInvitationsQuery,
} from "@/validators/invitation.validator";
import {
    createInvitationService,
    listInvitationsService,
    getInvitationByIdService,
    verifyInvitationService,
    acceptInvitationService,
    resendInvitationService,
    revokeInvitationService,
} from "@/utils/invitation.util";

type IdParams = { id: string };
type TokenParams = { token: string };

// ------------------- POST /api/invitations -------------------
export const createInvitation = asyncHandler(
    async (req: Request<any, any, CreateInvitationInput>, res: Response) => {
        const invitation = await createInvitationService(req.body);
        return ApiResponse.success(res, invitation, "Invitation sent successfully", 201);
    }
);

// ------------------- GET /api/invitations -------------------
export const listInvitations = asyncHandler(
    async (req: Request, res: Response) => {
        const query = req.query as unknown as ListInvitationsQuery;
        const result = await listInvitationsService(query);

        return ApiResponse.success(
            res,
            result.invitations,
            "Invitations retrieved successfully",
            200,
            result.meta
        );
    }
);

// ------------------- GET /api/invitations/:id -------------------
export const getInvitationById = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;
        const invitation = await getInvitationByIdService(id);

        return ApiResponse.success(res, invitation, "Invitation retrieved successfully");
    }
);

// ------------------- GET /api/invitations/verify/:token -------------------
export const verifyInvitation = asyncHandler(
    async (req: Request<TokenParams>, res: Response) => {
        const { token } = req.params;
        const data = await verifyInvitationService(token);

        return ApiResponse.success(res, data, "Invitation token is valid");
    }
);

// ------------------- POST /api/invitations/accept/:token -------------------
export const acceptInvitation = asyncHandler(
    async (req: Request<TokenParams, any, AcceptInvitationInput>, res: Response) => {
        const { token } = req.params;
        const { password } = req.body;

        const result = await acceptInvitationService(token, password);

        return ApiResponse.success(res, result, "Account setup completed successfully. You can now sign in.", 201);
    }
);

// ------------------- POST /api/invitations/:id/resend -------------------
export const resendInvitation = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;
        const invitation = await resendInvitationService(id);

        return ApiResponse.success(res, invitation, "Invitation resent successfully");
    }
);

// ------------------- PATCH /api/invitations/:id/revoke -------------------
export const revokeInvitation = asyncHandler(
    async (req: Request<IdParams>, res: Response) => {
        const { id } = req.params;
        const invitation = await revokeInvitationService(id);

        return ApiResponse.success(res, invitation, "Invitation revoked successfully");
    }
);
