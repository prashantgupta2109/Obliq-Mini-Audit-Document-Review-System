import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[id] — get client with documents (firm-scoped)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  const client = await prisma.client.findFirst({
    where: {
      id: params.id,
      firmId: session.firmId, // TENANT ISOLATION: always filter by firmId from JWT
    },
    include: {
      documents: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}
