import type { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "FOURI.IN Privacy Policy — how we collect, use, and protect your personal information.",
};

const sections = [
  {
    title: "Information We Collect",
    content: "We collect information you provide when creating an account, including your name, email address, and authentication data from Firebase (Google or email/password). When you upload question papers, we process them through our OCR and AI services to generate mock tests. We also collect usage data such as test attempts, scores, and platform interactions to improve our services.",
  },
  {
    title: "How We Use Your Information",
    content: "Your information is used to provide and improve our mock test platform, generate AI-powered tests from uploaded papers, send service-related communications, and analyse usage patterns to enhance user experience. We do not sell your personal data to third parties.",
  },
  {
    title: "Data Storage & Security",
    content: "Your data is stored securely on Firebase Authentication, Neon PostgreSQL, and Cloudinary. We use encryption in transit (HTTPS/TLS) and at rest. File uploads are processed through secure API calls to Google Vision and OpenAI. We implement industry-standard security measures to protect against unauthorised access.",
  },
  {
    title: "Third-Party Services",
    content: "We use Firebase (authentication and analytics), Cloudinary (file storage), Google Vision API (OCR), and OpenAI (AI analysis). Each service has its own privacy policy and data handling practices. We only share the minimum data necessary for these services to function.",
  },
  {
    title: "Advertising & Google AdSense",
    content: "We use Google AdSense to display advertisements on our platform. Google AdSense uses cookies (including DoubleClick DART cookies) to serve ads based on your prior visits to our website or other sites across the internet. You can opt out of personalized advertising by visiting Google's Ads Settings (https://adssettings.google.com) or the Network Advertising Initiative opt-out page (https://optout.networkadvertising.org). By accepting non-essential cookies via our cookie consent banner, you consent to the use of cookies for ad personalization. If you reject non-essential cookies, you may still see non-personalized ads based on general location and content context.",
  },
  {
    title: "Firebase Analytics",
    content: "We use Google Firebase Analytics (measurement ID: G-2JKRMYVJQV) to understand how users interact with our platform. This service collects anonymized usage data such as page views, session duration, and feature interactions. This data helps us improve our services and user experience. Firebase Analytics data is governed by Google's Privacy Policy.",
  },
  {
    title: "Your Rights",
    content: "You can access, update, or delete your account information at any time. Contact us at office@fouri.in to request data deletion or export. You may also disable cookies in your browser settings, though this may affect platform functionality.",
  },
  {
    title: "Cookies",
    content: "We use essential cookies for authentication and session management. For personalized advertising via Google AdSense, we use non-essential cookies (including DoubleClick DART cookies) only after you accept via our cookie consent banner. You can accept or reject non-essential cookies at any time. Essential cookies do not require consent. You can manage cookie preferences through our consent banner or your browser settings.",
  },
  {
    title: "Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the platform after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    content: "For privacy-related inquiries, including questions about our AdSense data practices, email us at office@fouri.in. We aim to respond within 48 business hours.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
            Privacy Policy
          </h1>
        </div>
        <p className="text-sm text-[#888899] mb-10">Last updated: May 2026</p>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-[#f5f5f7] mb-2">{s.title}</h2>
              <p className="text-sm text-[#c0c0cc] leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
