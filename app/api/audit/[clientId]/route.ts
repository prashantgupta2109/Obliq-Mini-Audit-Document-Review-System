import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit/[clientId] — get full audit history for a client (Reviewer only)
export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const result = await requireReviewer(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  // Verify client belongs to same firm (TENANT ISOLATION)
  const client = await prisma.client.findFirst({
    where: { id: params.clientId, firmId: session.firmId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      document: { clientId: params.clientId },
    },
    include: {
      user: { select: { id: true, name: true } },
      document: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ client, logs });
}
