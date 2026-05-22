import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "FOURI.IN — AI-Powered Mock Tests",
    description:
      "Upload question papers and get instant AI-generated mock tests with explanations.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
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
        <Analytics />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
