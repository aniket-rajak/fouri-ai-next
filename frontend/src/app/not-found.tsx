import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-6xl font-bold font-heading text-[#f5f5f7] mb-2">404</h1>
        <p className="text-lg text-[#888899] mb-2">Page not found</p>
        <p className="text-sm text-[#888899] mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
