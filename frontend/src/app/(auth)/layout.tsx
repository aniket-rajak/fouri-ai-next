import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login & Register",
  description: "Log in or create a free account on FOURI.IN to access AI-powered mock tests, track your performance, and prepare for JEE, NEET, WBJEE, CUET and more.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
