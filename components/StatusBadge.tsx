import { DocumentStatus } from "@/lib/types";

const statusConfig: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  UPLOADED: {
    label: "Uploaded",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  CORRECTION_REQUIRED: {
    label: "Correction Required",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-50 text-green-700 border-green-200",
  },
};

interface StatusBadgeProps {
  status: DocumentStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.PENDING;
  const sizeClass = size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClass} ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}
