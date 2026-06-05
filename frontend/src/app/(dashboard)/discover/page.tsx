import type { Metadata } from "next";
import { DiscoverClient } from "./discover-client";

export const metadata: Metadata = {
  title: "Discover Tests",
  description:
    "Browse, search, and discover AI-powered mock tests for JEE, NEET, WBJEE, CUET and more. Practice with free mock tests created by the community.",
  robots: { index: false, follow: false },
};

export default function DiscoverPage() {
  return (
    <>
      <div className="hidden" aria-hidden="true">
        Browse and search AI-powered mock tests for JEE, NEET, WBJEE, CUET and more. Practice with community-created free mock tests.
        Filter by subject, exam type, difficulty. Search for specific topics.
      </div>
      <DiscoverClient />
    </>
  );
}
