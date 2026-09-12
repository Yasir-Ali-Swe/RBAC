import "dotenv/config";
import { Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/mailer";
import {
    EMAIL_QUEUE_NAME,
    SEND_INVITATION_EMAIL_JOB,
    InvitationEmailJobData,
} from "@/lib/email.queue";

export const processInvitationEmail = async (job: Job<InvitationEmailJobData>) => {
    const { invitationId } = job.data;

    console.log(`[Worker] Processing invitation email job #${job.id} for invitation: ${invitationId}`);

    const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
            role: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!invitation) {
        console.warn(`[Worker] Invitation "${invitationId}" not found in database. Skipping email.`);
        return;
    }

    if (invitation.status !== "PENDING") {
        console.warn(
            `[Worker] Invitation "${invitationId}" is no longer PENDING (status: ${invitation.status}). Skipping email.`
        );
        return;
    }

    if (new Date(invitation.expiresAt) <= new Date()) {
        console.warn(`[Worker] Invitation "${invitationId}" has expired. Skipping email.`);
        return;
    }

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
    const invitationUrl = `${frontendUrl}/accept-invitation?token=${invitation.token}`;
    const expiryHours = Number(process.env.INVITATION_EXPIRY_HOURS) || 24;

    try {
        await sendInvitationEmail({
            name: invitation.name,
            email: invitation.email,
            roleName: invitation.role?.name || "Member",
            invitationUrl,
            expiryHours,
        });

        console.log(`[Worker] Invitation email successfully sent to ${invitation.email}`);
    } catch (error) {
        console.error(`[Worker] Failed to send email for invitation "${invitationId}":`, error);
        throw error; // Rethrow to let BullMQ handle retry with exponential backoff
    }
};

export const startWorker = () => {
    const worker = new Worker<InvitationEmailJobData>(
        EMAIL_QUEUE_NAME,
        async (job: Job<InvitationEmailJobData>) => {
            if (job.name === SEND_INVITATION_EMAIL_JOB) {
                await processInvitationEmail(job);
            }
        },
        {
            connection: redis,
            concurrency: 5,
        }
    );

    worker.on("ready", () => {
        console.log("🚀 BullMQ Email Worker is ready and listening for jobs...");
    });

    worker.on("completed", (job) => {
        console.log(`✅ Job #${job.id} [${job.name}] completed successfully.`);
    });

    worker.on("failed", (job, err) => {
        console.error(
            `❌ Job #${job?.id} [${job?.name}] failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}): ${err.message}`
        );
    });

    worker.on("error", (err) => {
        console.error("Worker encountered an error:", err);
    });

    const shutdown = async () => {
        console.log("Shutting down email worker gracefully...");
        await worker.close();
        await redis.quit();
        await prisma.$disconnect();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    return worker;
};

// If executed directly as a script
if (process.argv[1]?.includes("email.worker")) {
    startWorker();
}
