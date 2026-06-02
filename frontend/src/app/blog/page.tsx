import type { Metadata } from "next";
import { BlogListingClient } from "./blog-listing-client";
import { JsonLd } from "@/components/JsonLd";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest blogs on exam preparation, study tips, and AI-powered learning from FOURI.IN.",
  openGraph: {
    title: "Blog | FOURI.IN",
    description:
      "Read the latest blogs on exam preparation, study tips, and AI-powered learning.",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#08080f]">
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", url: "https://fouri.in" },
          { name: "Blog", url: "https://fouri.in/blog" },
        ])}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            FOURI Blog
          </h1>
          <p className="text-[#888899] mt-3 max-w-lg mx-auto">
            Tips, guides, and insights to help you prepare smarter for your exams.
          </p>
        </div>
        <BlogListingClient />
      </div>
    </main>
  );
}
