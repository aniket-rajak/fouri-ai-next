import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { CookieConsent } from "@/components/CookieConsent";
import { AdSenseScript } from "@/components/AdSenseScript";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "optional",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "optional",
});

export const metadata: Metadata = {
  title: {
    default: "FOURI.IN — AI-Powered Mock Tests for JEE, NEET & More",
    template: "%s | FOURI.IN",
  },
  description:
    "Upload question papers, generate AI-powered mock tests, and practice with real-time analytics. Free mock tests for JEE, NEET, WBJEE, CUET and more.",
  keywords: [
    "mock test",
    "JEE mock test",
    "NEET mock test",
    "AI practice test",
    "online exam",
    "free mock test",
    "JEE Main",
    "NEET UG",
    "WBJEE",
    "CUET",
  ],
  authors: [{ name: "FOURI.IN" }],
  metadataBase: new URL("https://fouri.in"),
  openGraph: {
    title: "FOURI.IN — AI-Powered Mock Tests",
    description:
      "Upload question papers and get instant AI-generated mock tests with explanations.",
    type: "website",
    locale: "en_IN",
    siteName: "FOURI.IN",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FOURI.IN — AI-Powered Mock Tests",
    description:
      "Upload question papers and get instant AI-generated mock tests with explanations.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  alternates: {
    canonical: "https://fouri.in",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${inter.variable} ${poppins.variable} h-full antialiased`}
      >
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
          <link
            rel="preload"
            as="image"
            href="/assets/images/hero/hero-1.jpg"
            fetchPriority="high"
          />
          <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "FOURI.IN",
            url: "https://fouri.in",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://fouri.in/discover?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "FOURI.IN",
            url: "https://fouri.in",
            description:
              "AI-powered mock test platform. Upload question papers and get instant AI-generated practice tests.",
            applicationCategory: "EducationalApplication",
            operatingSystem: "All",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#08080f] text-[#f5f5f7] font-sans">
        {children}
        <AdSenseScript />
        <GoogleAnalytics />
        <Toaster richColors position="top-center" />
        <CookieConsent />
      </body>
    </html>
  );
}
