import { notFound } from "next/navigation";
import Link from "next/link";
import {
  examPages,
  generateCourseJsonLd,
  generateWebsiteJsonLd,
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import ExamPageClient from "@/components/exam/ExamPageClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ examSlug: string }>;
}

export async function generateStaticParams() {
  return examPages.map((page) => ({ examSlug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examSlug } = await params;
  const page = examPages.find((p) => p.slug === examSlug);
  if (!page) return {};

  const keywords = [
    `${examSlug.replace("-mock-test", "")} mock test`,
    `free ${examSlug.replace("-mock-test", "")} practice`,
    `${page.examFullName} preparation`,
    `online ${examSlug.replace("-mock-test", "")} test series`,
    `AI ${examSlug.replace("-mock-test", "")} mock test`,
    "free mock test platform",
    "AI question paper analyzer",
    "FOURI.IN",
  ];

  return {
    title: page.title,
    description: page.description,
    keywords: keywords.join(", "),
    openGraph: {
      title: page.title,
      description: page.description,
      type: "website",
      locale: "en_IN",
      siteName: "FOURI.IN",
      url: `https://fouri.in/${examSlug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
    alternates: { canonical: `https://fouri.in/${examSlug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ExamPage({ params }: Props) {
  const { examSlug } = await params;
  const page = examPages.find((p) => p.slug === examSlug);
  if (!page) notFound();

  return (
    <>
      <JsonLd data={generateWebsiteJsonLd()} />
      <JsonLd
        data={generateCourseJsonLd(page.title, page.description, page.examFullName)}
      />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", url: "https://fouri.in" },
          { name: page.examFullName, url: `https://fouri.in/${examSlug}` },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(page.faqs)} />

      <ExamPageClient exam={page} />
    </>
  );
}
