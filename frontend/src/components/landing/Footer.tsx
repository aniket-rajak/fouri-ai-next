"use client";

import Link from "next/link";
import { Sparkles, Globe, MessageCircle, Mail } from "lucide-react";

const footerLinks = {
  features: [
    { label: "Upload Papers", href: "/upload" },
    { label: "OCR Extraction", href: "/#ai-analysis" },
    { label: "Mock Tests", href: "/#mock-tests" },
    { label: "Analytics", href: "/results" },
  ],
  resources: [
    { label: "JEE Mock Tests", href: "/jee-mock-test" },
    { label: "NEET Mock Tests", href: "/neet-mock-test" },
    { label: "WBJEE Mock Tests", href: "/wbjee-mock-test" },
    { label: "CUET Mock Tests", href: "/cuet-mock-test" },
    { label: "Blog", href: "/blog" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact", href: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-[#08080f] text-[#888899] overflow-hidden border-t border-white/5">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute -bottom-20 -right-20 text-[200px] sm:text-[300px] font-bold text-white/[0.02] select-none pointer-events-none leading-none">
        FOURI
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#f5f5f7] font-heading">
                FOURI
              </span>
            </Link>
            <p className="text-sm text-[#888899] leading-relaxed max-w-xs">
              Built for students. Powered by AI. Upload question papers and get
              instant AI-generated mock tests for smarter exam preparation.
            </p>
            <div className="mt-6 flex gap-3">
              {[Globe, MessageCircle, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300 transition-all"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f7] uppercase tracking-wider mb-4">
              Features
            </h4>
            <ul className="space-y-3">
              {footerLinks.features.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#888899] hover:text-blue-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f7] uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#888899] hover:text-blue-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f5f5f7] uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#888899] hover:text-blue-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#888899]/50">
            &copy; {new Date().getFullYear()} FOURI.IN. All rights reserved.
          </p>
          <p className="text-xs text-[#888899]/40 flex items-center gap-1.5">
            Built with
            <span className="text-blue-400">
              <Sparkles className="w-3 h-3 inline" />
            </span>
            for Indian students Thanks to ANIKET RAJAK
          </p>
        </div> */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#888899]/50">
            &copy; {new Date().getFullYear()} FOURI.IN. All rights reserved.
          </p>

          <p className="text-xs text-[#888899]/40 flex items-center gap-1.5">
            Built with
            <span className="text-blue-400">
              <Sparkles className="w-3 h-3 inline" />
            </span>
            for Students Thanks to{" "}
            <a
              href="https://aniketrajak.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ANIKET RAJAK
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
