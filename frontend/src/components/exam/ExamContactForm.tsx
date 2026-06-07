"use client";

import { useState } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Send, Loader2, CheckCircle, Mail, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface ExamContactFormProps {
  examName?: string;
}

export default function ExamContactForm({ examName }: ExamContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: examName ? `${examName} - Inquiry` : "",
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
        description: "We will get back to you within 24 hours.",
      });
      setForm({ name: "", email: "", subject: examName ? `${examName} - Inquiry` : "", message: "" });
    } catch (err) {
      toast.error("Failed to send", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d15] to-[#08080f] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
              Contact Us
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
              Have a Question? <span className="text-gradient">Get in Touch</span>
            </h2>
            <p className="mt-3 text-sm text-[#888899] max-w-lg mx-auto">
              We would love to hear from you. Send us a message and we will respond as soon as possible.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#111118] border border-white/[0.04] rounded-2xl p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot — hidden from users, catches bots */}
              <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="exam-name" className="block text-xs text-[#888899] mb-1.5 font-medium">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555566]" />
                    <input
                      id="exam-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#08080f] border border-white/[0.05] text-sm text-[#f5f5f7] placeholder-[#555566] focus:outline-none focus:border-[#3D81E3]/50 focus:ring-1 focus:ring-[#3D81E3]/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="exam-email" className="block text-xs text-[#888899] mb-1.5 font-medium">
                    Your Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555566]" />
                    <input
                      id="exam-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#08080f] border border-white/[0.05] text-sm text-[#f5f5f7] placeholder-[#555566] focus:outline-none focus:border-[#3D81E3]/50 focus:ring-1 focus:ring-[#3D81E3]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="exam-subject" className="block text-xs text-[#888899] mb-1.5 font-medium">
                  Subject <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555566]" />
                  <input
                    id="exam-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="How can we help you?"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#08080f] border border-white/[0.05] text-sm text-[#f5f5f7] placeholder-[#555566] focus:outline-none focus:border-[#3D81E3]/50 focus:ring-1 focus:ring-[#3D81E3]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="exam-message" className="block text-xs text-[#888899] mb-1.5 font-medium">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="exam-message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your message here..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-[#08080f] border border-white/[0.05] text-sm text-[#f5f5f7] placeholder-[#555566] focus:outline-none focus:border-[#3D81E3]/50 focus:ring-1 focus:ring-[#3D81E3]/20 transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="group relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </span>
              </button>
            </form>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
}
