import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// POST /api/documents — add a document to a client
export async function POST(req: NextRequest) {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  const { name, clientId } = await req.json();

  if (!name?.trim() || !clientId) {
    return NextResponse.json(
      { error: "Document name and clientId are required" },
      { status: 400 }
    );
  }

  // Verify client belongs to same firm (TENANT ISOLATION)
  const client = await prisma.client.findFirst({
    where: { id: clientId, firmId: session.firmId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const document = await prisma.document.create({
    data: {
      name: name.trim(),
      status: "PENDING",
      clientId,
      uploadedById: session.userId,
    },
  });

  await createAuditLog({
    documentId: document.id,
    userId: session.userId,
    action: `Added document "${document.name}"`,
  });

  return NextResponse.json({ document }, { status: 201 });
}
