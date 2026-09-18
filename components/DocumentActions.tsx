"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentStatus, UserRole } from "@/lib/types";

interface DocumentActionsProps {
  document: {
    id: string;
    name: string;
    status: DocumentStatus;
    clientId: string;
  };
  userRole: UserRole;
}

export default function DocumentActions({ document, userRole }: DocumentActionsProps) {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isStaff = userRole === "STAFF";
  const isReviewer = userRole === "REVIEWER";

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName.trim()) return;
    setError("");
    setLoading("upload");

    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setFileName("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function handleReview(action: "start_review" | "approve" | "request_correction") {
    if (action === "request_correction" && !comment.trim()) {
      setError("Please provide a reason for the correction request.");
      return;
    }
    setError("");
    setLoading(action);

    try {
      const res = await fetch(`/api/documents/${document.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: comment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Action failed");
        return;
      }

      setComment("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  // Staff (or Reviewer) can upload when PENDING or CORRECTION_REQUIRED
  const canUpload =
    (isStaff || isReviewer) &&
    (document.status === "PENDING" || document.status === "CORRECTION_REQUIRED");

  // Reviewer can start review when UPLOADED
  const canStartReview = isReviewer && document.status === "UPLOADED";

  // Reviewer can approve or request correction when UNDER_REVIEW
  const canReview = isReviewer && document.status === "UNDER_REVIEW";

  if (!canUpload && !canStartReview && !canReview) {
    if (document.status === "APPROVED") {
      return (
        <div className="card p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-sm font-medium text-green-700">Document Approved</p>
          <p className="text-xs text-gray-400 mt-0.5">No further action required.</p>
        </div>
      );
    }
    if (document.status === "UNDER_REVIEW" && isStaff) {
      return (
        <div className="card p-4 text-center text-sm text-gray-500">
          <div className="text-2xl mb-1">🔍</div>
          <p className="font-medium">Under Review</p>
          <p className="text-xs text-gray-400 mt-0.5">A reviewer is currently reviewing this document.</p>
        </div>
      );
    }
    if (document.status === "UPLOADED" && isStaff) {
      return (
        <div className="card p-4 text-center text-sm text-gray-500">
          <div className="text-2xl mb-1">📄</div>
          <p className="font-medium">Uploaded</p>
          <p className="text-xs text-gray-400 mt-0.5">Waiting for a reviewer to start the review.</p>
        </div>
      );
    }
    return (
      <div className="card p-4 text-center text-sm text-gray-400">
        No actions available for your role at this stage.
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Upload form */}
      {canUpload && (
        <form onSubmit={handleUpload} className="space-y-3">
          <p className="text-sm text-gray-600">
            {document.status === "CORRECTION_REQUIRED"
              ? "Upload the corrected document:"
              : "Upload the document file:"}
          </p>
          <div className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <input
              type="text"
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              placeholder="Enter filename (e.g. Bank_Statement.pdf)"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full justify-center"
            disabled={loading === "upload" || !fileName.trim()}
          >
            {loading === "upload" ? "Uploading..." : "Submit Document"}
          </button>
        </form>
      )}

      {/* Start review */}
      {canStartReview && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Document has been uploaded and is ready for review.
          </p>
          <button
            onClick={() => handleReview("start_review")}
            className="btn-primary w-full justify-center"
            disabled={loading === "start_review"}
          >
            {loading === "start_review" ? "Starting..." : "Start Review"}
          </button>
        </div>
      )}

      {/* Review actions */}
      {canReview && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Review this document:</p>

          <div>
            <label className="label">Comment / Reason (required for correction)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Page 3 is missing. Please upload the complete statement."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleReview("approve")}
              className="btn-success justify-center"
              disabled={!!loading}
            >
              {loading === "approve" ? "..." : "✓ Approve"}
            </button>
            <button
              onClick={() => handleReview("request_correction")}
              className="btn-danger justify-center"
              disabled={!!loading || !comment.trim()}
            >
              {loading === "request_correction" ? "..." : "Request Correction"}
            </button>
          </div>
          {!comment.trim() && (
            <p className="text-xs text-gray-400">
              A comment is required to request a correction.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
