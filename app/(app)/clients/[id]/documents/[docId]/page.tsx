import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import AuditTimeline from "@/components/AuditTimeline";
import DocumentActions from "@/components/DocumentActions";
import { DocumentStatus, UserRole } from "@/lib/types";

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string; docId: string };
}) {
  const session = await getSession();

  const document = await prisma.document.findFirst({
    where: {
      id: params.docId,
      client: { firmId: session!.firmId },
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

  if (!document) notFound();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link href="/clients" className="hover:text-gray-900">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${document.client.id}`} className="hover:text-gray-900">
          {document.client.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{document.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document details + actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Document info card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-gray-900">{document.name}</h1>
            </div>

            <StatusBadge status={document.status as DocumentStatus} size="md" />

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Client</p>
                <p className="text-sm text-gray-900 mt-0.5">{document.client.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Uploaded By</p>
                <p className="text-sm text-gray-900 mt-0.5">{document.uploadedBy.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Upload Date</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {new Date(document.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {document.fileName && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">File</p>
                  <p className="text-sm text-blue-600 mt-0.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {document.fileName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <DocumentActions
            document={{
              id: document.id,
              status: document.status as DocumentStatus,
              name: document.name,
              clientId: document.client.id,
            }}
            userRole={session!.role as UserRole}
          />
        </div>

        {/* Right: Audit history */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Document History
            </h2>
            <AuditTimeline
              logs={document.auditLogs.map((log) => ({
                ...log,
                createdAt: log.createdAt.toISOString(),
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
