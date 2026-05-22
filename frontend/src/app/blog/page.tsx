import type { Metadata } from "next";
import { BlogList } from "./blog-list";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Exam preparation tips, study strategies, and insights for JEE, NEET, WBJEE, CUET and more. Learn smarter with AI-powered mock tests from FOURI.IN.",
  openGraph: {
    title: "FOURI Blog — Exam Prep Tips & Insights",
    description:
      "Exam preparation tips, study strategies, and insights powered by AI mock tests.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FOURI Blog — Exam Prep Tips & Insights",
    description:
      "Exam preparation tips, study strategies, and insights powered by AI mock tests.",
  },
};

export default function BlogPage() {
  return <BlogList />;
}
