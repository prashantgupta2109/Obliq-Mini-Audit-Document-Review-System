interface AuditLog {
  id: string;
  action: string;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string };
  document?: { id: string; name: string };
}

interface AuditTimelineProps {
  logs: AuditLog[];
  showDocument?: boolean;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getActionIcon(action: string) {
  if (action.includes("Approved")) return "✅";
  if (action.includes("correction") || action.includes("Correction")) return "⚠️";
  if (action.includes("Uploaded revised") || action.includes("revised")) return "🔄";
  if (action.includes("Uploaded") || action.includes("uploaded")) return "📄";
  if (action.includes("reviewing") || action.includes("Started")) return "🔍";
  if (action.includes("Added")) return "➕";
  return "📋";
}

export default function AuditTimeline({ logs, showDocument = false }: AuditTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No audit history yet.
      </div>
    );
  }

  // Group logs by date
  const grouped: Record<string, AuditLog[]> = {};
  for (const log of logs) {
    const dateKey = formatDate(log.createdAt);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(log);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateLogs]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
              {date}
            </div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-4">
              {dateLogs.map((log) => (
                <div key={log.id} className="flex gap-4 relative">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-base z-10">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {log.user.name}
                        </span>{" "}
                        <span className="text-gray-600 text-sm">{log.action}</span>
                        {showDocument && log.document && (
                          <span className="ml-1 text-xs text-blue-600 font-medium">
                            — {log.document.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>

                    {log.comment && (
                      <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <p className="text-xs font-medium text-amber-700 mb-0.5">Reason:</p>
                        <p className="text-sm text-amber-800">{log.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
