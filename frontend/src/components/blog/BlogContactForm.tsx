"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface BlogContactFormProps {
  blogTitle?: string;
}

export function BlogContactForm({ blogTitle }: BlogContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: blogTitle ? `Regarding: ${blogTitle}` : "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      toast.success("Message sent!", {
        description: "We'll get back to you within 24 hours.",
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error("Failed to send", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111118] border border-white/5 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#888899] mb-1.5">Your Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              required
              className="w-full h-11 px-4 rounded-xl bg-[#08080f] border border-white/5 text-sm text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888899] mb-1.5">Your Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@example.com"
              required
              className="w-full h-11 px-4 rounded-xl bg-[#08080f] border border-white/5 text-sm text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#888899] mb-1.5">Subject *</label>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="How can we help you?"
            required
            className="w-full h-11 px-4 rounded-xl bg-[#08080f] border border-white/5 text-sm text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-[#888899] mb-1.5">Message *</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Write your message here..."
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-[#08080f] border border-white/5 text-sm text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50 transition-colors resize-y"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {sending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </motion.div>
  );
}
