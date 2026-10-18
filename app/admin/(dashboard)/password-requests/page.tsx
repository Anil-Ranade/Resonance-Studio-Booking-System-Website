"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, MessageCircle } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface PasswordRequest {
  id: string;
  phone_number: string;
  name: string | null;
  status: "pending" | "resolved";
  admin_note: string | null;
  created_at: string;
}

export default function PasswordRequestsPage() {
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [lastChanged, setLastChanged] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const load = async () => {
    const response = await adminFetch("/api/admin/password-requests");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load requests.");
    setRequests(data.requests || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const changePassword = async (request: PasswordRequest) => {
    const password = passwords[request.id] || "";
    if (password.length < 8) {
      setError("Passwords must be at least 8 characters.");
      return;
    }
    setError("");
    const response = await adminFetch("/api/admin/password-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: request.id, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to change password.");
      return;
    }
    setLastChanged((current) => ({ ...current, [request.id]: password }));
    await load();
  };

  const whatsappHref = (request: PasswordRequest) => {
    const password = lastChanged[request.id];
    if (!password) return "#";
    const message = `Hello ${request.name || ""}, your Resonance Studio password has been changed. Your new password is: ${password}`;
    return `https://wa.me/91${request.phone_number}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.16em] text-violet-300">Customer access</p>
        <h1 className="text-3xl font-bold text-white mt-1">Password reset requests</h1>
        <p className="text-zinc-400 mt-1">Set a new password, then send it to the customer on WhatsApp.</p>
      </header>
      {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</p>}
      <div className="space-y-3">
        {requests.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-zinc-400">No password reset requests.</div>}
        {requests.map((request) => (
          <div key={request.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-white font-semibold"><KeyRound className="size-4 text-violet-300" />{request.name || "Unnamed customer"}</div>
              <p className="text-sm text-zinc-400 mt-1">+91 {request.phone_number} · {new Date(request.created_at).toLocaleString("en-IN")}</p>
              <span className={`inline-flex mt-2 px-2 py-1 rounded-full text-xs ${request.status === "pending" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{request.status}</span>
            </div>
            {request.status === "pending" ? (
              <div className="flex flex-col sm:flex-row gap-2 lg:w-[32rem]">
                <div className="relative flex-1">
                  <input type={visiblePasswords[request.id] ? "text" : "password"} value={passwords[request.id] || ""} onChange={(e) => setPasswords((current) => ({ ...current, [request.id]: e.target.value }))} placeholder="New password (8+ chars)" className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 pr-10 text-white" />
                  <button type="button" onClick={() => setVisiblePasswords((current) => ({ ...current, [request.id]: !current[request.id] }))} aria-label={visiblePasswords[request.id] ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    {visiblePasswords[request.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <button onClick={() => changePassword(request)} className="h-10 px-4 rounded-lg bg-violet-400 text-navy font-semibold inline-flex items-center justify-center gap-2"><Check className="size-4" /> Change password</button>
              </div>
            ) : lastChanged[request.id] ? (
              <a href={whatsappHref(request)} target="_blank" rel="noreferrer" className="h-10 px-4 rounded-lg bg-emerald-500 text-white font-semibold inline-flex items-center justify-center gap-2"><MessageCircle className="size-4" /> Share on WhatsApp</a>
            ) : <span className="text-sm text-zinc-500">Password already changed</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
