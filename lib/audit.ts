import { prisma } from "./prisma";

/**
 * Creates an immutable audit log entry.
 * This is the ONLY place audit logs are written.
 * Never exposed as an editable API endpoint.
 */
export async function createAuditLog({
  documentId,
  userId,
  action,
  comment,
}: {
  documentId: string;
  userId: string;
  action: string;
  comment?: string;
}) {
  return prisma.auditLog.create({
    data: {
      documentId,
      userId,
      action,
      comment: comment ?? null,
    },
  });
}
