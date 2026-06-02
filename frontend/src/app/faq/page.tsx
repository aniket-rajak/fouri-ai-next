import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to commonly asked questions about FOURI.IN — our AI-powered mock test platform, features, supported exams, and more.",
};

const faqs = [
  {
    q: "Is FOURI completely free?",
    a: "Yes! FOURI.IN is completely free to use. You can upload question papers, generate AI-powered mock tests, and track your performance without any cost. We believe in making quality exam preparation accessible to every student.",
  },
  {
    q: "Which file formats are supported for upload?",
    a: "We currently support PDF, JPG, JPEG, and PNG file formats for question paper uploads. Make sure your files are clear and legible for the best OCR results. Maximum file size is 10 MB per upload.",
  },
  {
    q: "Can AI read handwritten question papers?",
    a: "Yes! Our OCR technology supports both printed and handwritten text. It can process handwriting in Bengali, Hindi, and English with high accuracy. For best results, ensure the handwriting is clear and well-lit.",
  },
  {
    q: "Does the platform support Bengali, Hindi & English?",
    a: "Absolutely. FOURI.IN fully supports question papers and content in Bengali, Hindi, and English. Our AI can analyze and generate mock tests from papers in all three languages.",
  },
  {
    q: "How accurate is the OCR?",
    a: "Our OCR achieves 95%+ accuracy for printed text and 85%+ accuracy for clear handwritten text. Accuracy improves with higher quality uploads. We continuously refine our AI models to improve recognition across all supported languages.",
  },
  {
    q: "Which exams are supported?",
    a: "FOURI.IN supports a wide range of competitive exams including JEE Main & Advanced, NEET UG & PG, WBJEE, CUET UG & PG, CBSE Board exams, UPSC, and many more. If your exam isn't listed, you can still upload papers and our AI will adapt to the format.",
  },
  {
    q: "How does the AI generate mock tests?",
    a: "When you upload a question paper, our AI (powered by OpenAI and Google Vision) analyzes the content, extracts questions and answers, and generates a fully interactive mock test. You can then practice with timed attempts, track your score, and review detailed performance analytics.",
  },
  {
    q: "Can I retake a mock test?",
    a: "Yes, you can attempt each mock test multiple times. Each attempt is tracked separately so you can monitor your improvement over time. You can also pause and resume tests if you need a break.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use Firebase Authentication for secure login, HTTPS/TLS encryption for all data transmission, and industry-standard security practices. Your uploaded papers are processed securely and stored in compliance with our Privacy Policy.",
  },
  {
    q: "How do I delete my account?",
    a: "You can delete your account at any time by contacting us at office@fouri.in. We will remove your personal data and uploaded content in accordance with our Privacy Policy within 48 business hours.",
  },
  {
    q: "Do you have a mobile app?",
    a: "Currently, FOURI.IN is a web-based platform optimized for all devices including mobile phones and tablets. A dedicated mobile app is on our roadmap for future release.",
  },
  {
    q: "How can I contact support?",
    a: "You can reach us via the Contact Us page, email us directly at office@fouri.in, or call us at +91 6291250328. We aim to respond to all inquiries within 24 hours.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#08080f]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }}
      />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", url: "https://fouri.in" },
          { name: "FAQ", url: "https://fouri.in/faq" },
        ])}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
            Frequently Asked Questions
          </h1>
        </div>
        <p className="text-sm text-[#888899] mb-10">
          Everything you need to know about FOURI.IN. Can&apos;t find what you&apos;re looking for?{" "}
          <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">
            Contact us
          </a>.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group bg-[#111118] border border-white/5 rounded-2xl overflow-hidden open:border-blue-500/20 transition-all"
            >
              <summary className="flex items-center justify-between px-5 py-4 text-sm font-medium text-[#f5f5f7] cursor-pointer hover:text-blue-300 transition-colors list-none">
                {faq.q}
                <span className="shrink-0 ml-2 text-[#888899] group-open:text-blue-400 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-open:rotate-180 transition-transform">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="px-5 pb-4">
                <p className="text-sm text-[#c0c0cc] leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
