import type { Metadata } from "next";
import { BlogDetail } from "./blog-detail";
import { JsonLd } from "@/components/JsonLd";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${API}/blogs/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Not found");
    const { blog } = await res.json();

    return {
      title: blog.title,
      description: blog.excerpt || `Read about ${blog.title} on FOURI.IN Blog`,
      openGraph: {
        title: `${blog.title} | FOURI.IN`,
        description: blog.excerpt || `Read about ${blog.title}`,
        type: "article",
        publishedTime: blog.createdAt,
        authors: [blog.author],
        images: blog.imageUrl ? [{ url: blog.imageUrl }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${blog.title} | FOURI.IN`,
        description: blog.excerpt || `Read about ${blog.title}`,
        images: blog.imageUrl ? [blog.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Blog Post | FOURI.IN",
      description: "Blog post from FOURI.IN",
    };
  }
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let articleJsonLd = null;

  try {
    const res = await fetch(`${API}/blogs/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const { blog } = await res.json();
      articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: blog.title,
        description: blog.excerpt || "",
        author: { "@type": "Person", name: blog.author },
        datePublished: blog.createdAt,
        dateModified: blog.updatedAt || blog.createdAt,
        image: blog.imageUrl || undefined,
        publisher: {
          "@type": "Organization",
          name: "FOURI.IN",
          url: "https://fouri.in",
        },
      };
    }
  } catch {
    // backend unavailable
  }

  return (
    <>
      {articleJsonLd && <JsonLd data={articleJsonLd} />}
      <BlogDetail slug={slug} />
    </>
  );
}
