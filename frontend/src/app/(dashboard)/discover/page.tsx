import type { Metadata } from "next";
import { DiscoverClient } from "./discover-client";

export const metadata: Metadata = {
  title: "Discover Tests",
  description:
    "Browse, search, and discover AI-powered mock tests for JEE, NEET, WBJEE, CUET and more. Practice with free mock tests created by the community.",
  openGraph: {
    title: "Discover Tests | FOURI.IN",
    description: "Find and practice AI-powered mock tests for your exam preparation.",
  },
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}
