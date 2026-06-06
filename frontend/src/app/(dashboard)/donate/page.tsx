"use client";

import { useState } from "react";
import { Heart, Copy, Check, ExternalLink, Send, Phone, Mail, Banknote } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const UPI_ID = "aniketrajak6291@oksbi";
const QR_URL = "/assets/images/donation/qr.jpeg";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function DonatePage() {
  const [qrError, setQrError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-red-500 mb-2">
          <Heart size={32} className="fill-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Support FOUR I</h1>
        <p className="text-zinc-600 leading-relaxed max-w-xl mx-auto">
          FOUR I is committed to providing free AI-powered learning tools, mock tests,
          and educational resources for students. Your support helps us maintain servers,
          AI infrastructure, databases, and platform development.
        </p>
        <p className="text-sm text-zinc-500">
          Every contribution, no matter how small, helps us keep FOUR I free and accessible for everyone.
        </p>
      </div>

      {/* QR + UPI */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-5 flex items-center gap-2">
          <Phone size={20} className="text-blue-600" />
          UPI Payment
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            {qrError ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-center px-4">
                <p className="text-xs text-zinc-500 font-medium">QR unavailable</p>
                <p className="text-[10px] text-zinc-400 mt-1">Use UPI ID below</p>
              </div>
            ) : (
              <img
                src={QR_URL}
                alt="UPI QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl border border-zinc-200"
                onError={() => setQrError(true)}
              />
            )}
          </div>
          <div className="space-y-3 text-center sm:text-left">
            <p className="text-sm text-zinc-600">Scan this QR code or use the UPI ID below to donate:</p>
            <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <Banknote size={18} className="text-green-600 shrink-0" />
              <code className="text-sm font-mono font-semibold text-zinc-900">{UPI_ID}</code>
              <CopyButton text={UPI_ID} />
            </div>
            <p className="text-xs text-zinc-400">
              Supported by all UPI apps: Google Pay, PhonePe, Paytm, BHIM, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Bank Transfer */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-5 flex items-center gap-2">
          <Banknote size={20} className="text-green-600" />
          Bank Transfer Details
        </h2>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Account Holder", "ANIKET RAJAK"],
                ["Bank Name", "STATE BANK OF INDIA (SBI)"],
                ["Branch", "HARIDEVPUR"],
                ["Account Number", "33816877163"],
                ["IFSC Code", "SBIN001530"],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-zinc-200 last:border-b-0">
                  <td className="px-4 py-3 text-zinc-500 font-medium w-40">{label}</td>
                  <td className="px-4 py-3 text-zinc-900 font-semibold flex items-center gap-2">
                    <span>{value}</span>
                    {label === "Account Number" || label === "IFSC Code" ? (
                      <CopyButton text={value} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thank You */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6 sm:p-8 text-center space-y-3">
        <Heart size={28} className="text-red-500 fill-red-500 mx-auto" />
        <h2 className="text-lg font-semibold text-zinc-900">Thank You</h2>
        <p className="text-sm text-zinc-600 leading-relaxed max-w-lg mx-auto">
          Your support directly contributes to improving FOUR I and helping thousands of
          students access quality AI-powered learning resources at no cost.
        </p>
        <p className="text-sm font-medium text-zinc-800">
          Together, we can make education smarter, more accessible, and free for everyone. ❤️
        </p>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1 flex items-center gap-2">
          <Mail size={20} className="text-purple-600" />
          Get in Touch
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          Have questions about donating or need help with the platform? Send us a message.
        </p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
            <Check size={24} className="text-green-600 mx-auto" />
            <p className="text-sm font-semibold text-green-900">Message sent successfully!</p>
            <p className="text-xs text-green-700">We&apos;ll get back to you shortly.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-2 text-xs text-green-600 underline hover:text-green-800 cursor-pointer"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-zinc-700 mb-1">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={form.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-900 outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span>•</span> {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {sending ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
