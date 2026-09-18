import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireReviewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// GET /api/clients — list all clients for the authenticated user's firm
export async function GET(req: NextRequest) {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  const clients = await prisma.client.findMany({
    where: { firmId: session.firmId },
    include: {
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clients });
}

// POST /api/clients — create a new client (Reviewer only)
export async function POST(req: NextRequest) {
  const result = await requireReviewer(req);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      name: name.trim(),
      firmId: session.firmId,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
