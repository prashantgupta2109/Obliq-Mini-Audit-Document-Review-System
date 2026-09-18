"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { JWTPayload } from "@/lib/auth";

interface NavbarProps {
  session: JWTPayload;
}

export default function Navbar({ session }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const roleBadgeColor =
    session.role === "REVIEWER"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/clients" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-lg">Obliq</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            <Link
              href="/clients"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/clients")
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Clients
            </Link>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{session.name}</p>
              <p className="text-xs text-gray-500">{session.firmName}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeColor}`}>
              {session.role === "REVIEWER" ? "Reviewer" : "Staff"}
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
