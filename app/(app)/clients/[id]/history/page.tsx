import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AuditTimeline from "@/components/AuditTimeline";

export default async function AuditHistoryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  // Only reviewers can view audit history
  if (session!.role !== "REVIEWER") {
    redirect(`/clients/${params.id}`);
  }

  const client = await prisma.client.findFirst({
    where: { id: params.id, firmId: session!.firmId },
  });

  if (!client) notFound();

  const logs = await prisma.auditLog.findMany({
    where: {
      document: { clientId: params.id },
    },
    include: {
      user: { select: { id: true, name: true } },
      document: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/clients" className="hover:text-gray-900">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${client.id}`} className="hover:text-gray-900">
          {client.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Audit History</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
          <p className="text-gray-500 text-sm mt-1">{client.name} · {logs.length} events recorded</p>
        </div>
        <Link href={`/clients/${client.id}`} className="btn-secondary">
          ← Back to Documents
        </Link>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6 text-sm text-amber-800">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>
          Audit history is <strong>read-only</strong>. These records are system-generated and cannot be edited by any user.
        </span>
      </div>

      <div className="card p-6">
        <AuditTimeline
              logs={logs.map((log) => ({
                ...log,
                createdAt: log.createdAt.toISOString(),
              }))}
              showDocument={true}
            />
      </div>
    </div>
  );
}
