import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import AddDocumentForm from "@/components/AddDocumentForm";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  const client = await prisma.client.findFirst({
    where: { id: params.id, firmId: session!.firmId },
    include: {
      documents: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!client) notFound();

  const totalDocs = client.documents.length;
  const approvedDocs = client.documents.filter((d) => d.status === "APPROVED").length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/clients" className="hover:text-gray-900">Clients</Link>
        <span>/</span>
        <span className="text-gray-900">{client.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {approvedDocs} / {totalDocs} documents approved
          </p>
        </div>
        <div className="flex gap-3">
          {session!.role === "REVIEWER" && (
            <Link href={`/clients/${client.id}/history`} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Audit History
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalDocs > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round((approvedDocs / totalDocs) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(approvedDocs / totalDocs) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Documents list */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Required Documents</h2>
        </div>

        {client.documents.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            No documents yet. Add the required documents below.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {client.documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/clients/${client.id}/documents/${doc.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Doc icon */}
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {doc.name}
                      </p>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {doc.fileName ? (
                        <span>📎 {doc.fileName}</span>
                      ) : (
                        <span>No file uploaded</span>
                      )}
                      {" · "}
                      <span>Added by {doc.uploadedBy.name}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add document */}
      <AddDocumentForm clientId={client.id} />
    </div>
  );
}
