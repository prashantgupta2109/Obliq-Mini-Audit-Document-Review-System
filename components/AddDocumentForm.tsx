"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTED_DOCS = [
  "Bank Statement",
  "Sales Register",
  "Purchase Register",
  "GST Return",
  "Expense Summary",
];

export default function AddDocumentForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), clientId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add document");
        return;
      }

      setSuccess(`"${name.trim()}" added successfully`);
      setName("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Add Required Document</h2>

      {/* Suggestions */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SUGGESTED_DOCS.map((doc) => (
          <button
            key={doc}
            type="button"
            onClick={() => setName(doc)}
            className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {doc}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          className="input flex-1"
          placeholder="Document name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button
          type="submit"
          className="btn-primary whitespace-nowrap"
          disabled={loading || !name.trim()}
        >
          {loading ? "Adding..." : "Add Document"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 mt-2">✓ {success}</p>
      )}
    </div>
  );
}
