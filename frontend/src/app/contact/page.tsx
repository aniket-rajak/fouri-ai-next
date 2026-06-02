import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with FOURI.IN. Have questions, feedback, or need help with our AI-powered mock test platform? We'd love to hear from you.",
  openGraph: {
    title: "Contact FOURI.IN",
    description: "Get in touch with the FOURI.IN team. We're here to help.",
  },
};

export default function ContactPage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FOURI.IN",
    url: "https://fouri.in",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91 6291250328",
      contactType: "customer service",
      email: "office@fouri.in",
      areaServed: "IN",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tollygunge",
      addressRegion: "Kolkata",
      addressCountry: "IN",
    },
  };

  return (
    <>
      <JsonLd data={orgJsonLd} />
      <ContactForm />
    </>
  );
}
