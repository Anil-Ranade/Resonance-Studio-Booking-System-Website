"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit request.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <Link href="/booking/new" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="size-4" /> Back to booking
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="size-12 mx-auto text-emerald-400" />
              <h1 className="text-2xl font-bold">Request sent</h1>
              <p className="text-muted-foreground">We will review your request and contact you on WhatsApp after your password is reset.</p>
              <Link href="/booking/new" className="inline-block text-primary underline">Return to booking</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <LockKeyhole className="size-9 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Forgot password?</h1>
                <p className="text-sm text-muted-foreground mt-1">Send a reset request to the studio team.</p>
              </div>
              <input required inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="WhatsApp number" className="w-full h-11 rounded-lg border border-border bg-background px-3" />
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="w-full h-11 rounded-lg border border-border bg-background px-3" />
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <button disabled={loading} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50">{loading ? "Sending…" : "Send reset request"}</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
