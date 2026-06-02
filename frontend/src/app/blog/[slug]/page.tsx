import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostClient } from "./blog-post-client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getBlog(slug: string) {
  try {
    const res = await fetch(`${API}/blog/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.blog;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return { title: "Blog Not Found" };

  return {
    title: blog.title,
    description: blog.excerpt || `Read ${blog.title} on FOURI.IN`,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || "",
      type: "article",
      publishedTime: blog.publishedAt,
      authors: blog.authorName ? [blog.authorName] : undefined,
      images: blog.thumbnailUrl ? [{ url: blog.thumbnailUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt || "",
      images: blog.thumbnailUrl ? [blog.thumbnailUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    author: blog.authorName ? { "@type": "Person", name: blog.authorName } : { "@type": "Organization", name: "FOURI.IN" },
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    image: blog.thumbnailUrl,
    publisher: { "@type": "Organization", name: "FOURI.IN" },
  };

  return (
    <main className="min-h-screen bg-[#08080f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient blog={blog} />
    </main>
  );
}
