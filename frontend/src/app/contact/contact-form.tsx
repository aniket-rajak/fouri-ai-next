"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Tollygunge, Kolkata, West Bengal, India" },
  { icon: Mail, label: "Email", value: "office@fouri.in" },
  { icon: Phone, label: "Phone", value: "+91 (033) 1234-5678" },
];

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
              Contact Us
            </h1>
          </div>
          <p className="text-[#888899] text-lg max-w-xl mx-auto">
            Have a question, feedback, or need help? We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {contactInfo.map((info) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111118] rounded-2xl border border-white/5 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#888899] uppercase tracking-wider">{info.label}</p>
                      <p className="text-sm text-[#f5f5f7] font-medium mt-0.5">{info.value}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#111118] rounded-2xl border border-white/5 overflow-hidden h-64"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58969.97522053863!2d88.3325938743164!3d22.5015106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a02712353b4e6a7%3A0x3b8e7a9a9e9c8f0!2sTollygunge%2C%20Kolkata%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="FOURI.IN Location - Tollygunge, Kolkata"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-[#111118] rounded-2xl border border-white/5 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-[#f5f5f7] mb-6">Send us a message</h2>

              {sent ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#f5f5f7] mb-2">Message Sent!</h3>
                  <p className="text-sm text-[#888899] mb-6">
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="h-10 px-6 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
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
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-[#08080f] border border-white/5 text-sm text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50 transition-colors resize-y"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>
                  )}

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
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
