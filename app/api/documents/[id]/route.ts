import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export type DocumentStatus =
  | "PENDING"
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "APPROVED";

// GET /api/documents/[id] — get document with audit logs (firm-scoped)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  const document = await prisma.document.findFirst({
    where: {
      id: params.id,
      client: { firmId: session.firmId }, // TENANT ISOLATION via relation
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      auditLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ document });
}

// PATCH /api/documents/[id] — upload file for a document (Staff or Reviewer)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  const { fileName } = await req.json();

  if (!fileName?.trim()) {
    return NextResponse.json({ error: "File name is required" }, { status: 400 });
  }

  // Verify document belongs to same firm
  const existing = await prisma.document.findFirst({
    where: {
      id: params.id,
      client: { firmId: session.firmId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Can only upload if status is PENDING or CORRECTION_REQUIRED
  if (existing.status !== "PENDING" && existing.status !== "CORRECTION_REQUIRED") {
    return NextResponse.json(
      { error: "Document cannot be uploaded in its current status" },
      { status: 400 }
    );
  }

  const isRevision = existing.status === "CORRECTION_REQUIRED";

  const document = await prisma.document.update({
    where: { id: params.id },
    data: {
      fileName: fileName.trim(),
      status: "UPLOADED",
    },
  });

  await createAuditLog({
    documentId: document.id,
    userId: session.userId,
    action: isRevision
      ? `Uploaded revised document: ${fileName.trim()}`
      : `Uploaded ${fileName.trim()}`,
  });

  return NextResponse.json({ document });
}
