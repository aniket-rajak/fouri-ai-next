import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "FOURI.IN Disclaimer — limitations of liability for AI-generated content, accuracy disclaimers, and terms of use for our mock test platform.",
};

const sections = [
  {
    title: "General Information Only",
    content: "The content provided on FOURI.IN, including AI-generated mock tests, study materials, and blog posts, is for general educational and informational purposes only. It does not constitute professional advice, guarantee exam performance, or assure specific academic outcomes.",
  },
  {
    title: "AI-Generated Content",
    content: "Mock tests, questions, and analyses on this platform are generated using artificial intelligence (AI) models, including OpenAI and Google Vision API. While we strive for accuracy, AI-generated content may contain errors, inaccuracies, or omissions. Users are encouraged to verify critical information independently before relying on it for exam preparation.",
  },
  {
    title: "No Guarantee of Exam Results",
    content: "FOURI.IN does not guarantee that use of our platform will lead to specific exam scores, rankings, or admissions. Exam performance depends on numerous factors including individual effort, preparation quality, and external circumstances beyond our control.",
  },
  {
    title: "Third-Party Services",
    content: "Our platform integrates with third-party services including Firebase (authentication), OpenAI (AI analysis), Google Vision API (OCR), and Cloudinary (storage). We are not responsible for the availability, accuracy, or security of these third-party services. Users should review the respective privacy policies and terms of these services.",
  },
  {
    title: "Uploaded Content",
    content: "Users are solely responsible for the question papers and content they upload to FOURI.IN. We do not claim ownership of uploaded materials, nor do we endorse their accuracy or legality. Users must ensure they have the right to upload and share any content submitted to the platform.",
  },
  {
    title: "No Warranties",
    content: "FOURI.IN is provided 'as is' and 'as available' without any warranties, express or implied. We disclaim all warranties including, but not limited to, merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the platform will be uninterrupted, error-free, or free of harmful components.",
  },
  {
    title: "Limitation of Liability",
    content: "To the fullest extent permitted by law, FOURI.IN and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the platform. This includes, but is not limited to, loss of data, exam results, academic performance, or financial loss.",
  },
  {
    title: "External Links",
    content: "Our platform and blog may contain links to external websites. We are not responsible for the content, accuracy, or practices of these third-party sites. Inclusion of any link does not imply endorsement by FOURI.IN.",
  },
  {
    title: "Changes to This Disclaimer",
    content: "We reserve the right to update or modify this disclaimer at any time without prior notice. Changes will be posted on this page with an updated revision date. Continued use of the platform after changes constitutes acceptance of the updated disclaimer.",
  },
  {
    title: "Contact Us",
    content: "If you have questions about this disclaimer, please contact us at office@fouri.in or call +91 6291250328.",
  },
];

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
            Disclaimer
          </h1>
        </div>
        <p className="text-sm text-[#888899] mb-10">Last updated: June 2026</p>

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
