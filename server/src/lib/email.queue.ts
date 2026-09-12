import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export interface InvitationEmailJobData {
    invitationId: string;
}

export const EMAIL_QUEUE_NAME = "email";
export const SEND_INVITATION_EMAIL_JOB = "send-invitation-email";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const addInvitationEmailJob = async (invitationId: string) => {
    return await emailQueue.add(SEND_INVITATION_EMAIL_JOB, {
        invitationId,
    } as InvitationEmailJobData);
};
