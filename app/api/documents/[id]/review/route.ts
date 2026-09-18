import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type ReviewAction = "start_review" | "approve" | "request_correction";

// POST /api/documents/[id]/review — reviewer actions (Reviewer only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireReviewer(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  const { action, comment } = (await req.json()) as {
    action: ReviewAction;
    comment?: string;
  };

  // Verify document belongs to same firm (TENANT ISOLATION)
  const existing = await prisma.document.findFirst({
    where: {
      id: params.id,
      client: { firmId: session.firmId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  let newStatus: string;
  let auditAction: string;

  switch (action) {
    case "start_review":
      if (existing.status !== "UPLOADED") {
        return NextResponse.json(
          { error: "Document must be uploaded before review can start" },
          { status: 400 }
        );
      }
      newStatus = "UNDER_REVIEW";
      auditAction = "Started reviewing";
      break;

    case "approve":
      if (existing.status !== "UNDER_REVIEW") {
        return NextResponse.json(
          { error: "Document must be under review to be approved" },
          { status: 400 }
        );
      }
      newStatus = "APPROVED";
      auditAction = "Approved document";
      break;

    case "request_correction":
      if (existing.status !== "UNDER_REVIEW") {
        return NextResponse.json(
          { error: "Document must be under review to request correction" },
          { status: 400 }
        );
      }
      if (!comment?.trim()) {
        return NextResponse.json(
          { error: "A reason/comment is required when requesting correction" },
          { status: 400 }
        );
      }
      newStatus = "CORRECTION_REQUIRED";
      auditAction = "Requested correction";
      break;

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const document = await prisma.document.update({
    where: { id: params.id },
    data: { status: newStatus },
  });

  await createAuditLog({
    documentId: document.id,
    userId: session.userId,
    action: auditAction,
    comment: comment?.trim(),
  });

  return NextResponse.json({ document });
}
