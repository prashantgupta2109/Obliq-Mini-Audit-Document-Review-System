import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DocumentStatus } from "@/lib/types";

function getStatusSummary(documents: { status: DocumentStatus }[]) {
  const counts = {
    pending: documents.filter(
      (d) => d.status === "PENDING" || d.status === "CORRECTION_REQUIRED"
    ).length,
    inProgress: documents.filter(
      (d) => d.status === "UPLOADED" || d.status === "UNDER_REVIEW"
    ).length,
    approved: documents.filter((d) => d.status === "APPROVED").length,
    total: documents.length,
  };
  return counts;
}

export default async function ClientsPage() {
  const session = await getSession();

  const clients = await prisma.client.findMany({
    where: { firmId: session!.firmId },
    include: {
      documents: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{session!.firmName}</p>
        </div>
        {session!.role === "REVIEWER" && (
          <Link href="/clients/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Client
          </Link>
        )}
      </div>

      {/* Clients grid */}
      {clients.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-lg font-medium text-gray-700">No clients yet</h3>
          {session!.role === "REVIEWER" ? (
            <p className="text-gray-400 text-sm mt-1">
              Create your first client to get started.
            </p>
          ) : (
            <p className="text-gray-400 text-sm mt-1">
              No clients have been assigned to this firm yet.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const summary = getStatusSummary(client.documents);
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {client.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {summary.total} document{summary.total !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Status pills */}
                <div className="flex gap-2 flex-wrap">
                  {summary.approved > 0 && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                      {summary.approved} approved
                    </span>
                  )}
                  {summary.inProgress > 0 && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5 font-medium">
                      {summary.inProgress} in progress
                    </span>
                  )}
                  {summary.pending > 0 && (
                    <span className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-medium">
                      {summary.pending} pending
                    </span>
                  )}
                  {summary.total === 0 && (
                    <span className="text-xs text-gray-400">No documents</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
