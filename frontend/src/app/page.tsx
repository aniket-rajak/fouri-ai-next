import Link from "next/link";

const features = [
  {
    title: "Upload Any Paper",
    desc: "Drag & drop your question papers (PDF, JPG, PNG). Our AI reads and understands every question instantly.",
    icon: "📄",
  },
  {
    title: "AI Generates Mock Tests",
    desc: "Questions are extracted, organized, and turned into a timed, interactive mock test automatically.",
    icon: "🤖",
  },
  {
    title: "Real-Time Practice",
    desc: "Full-screen exam mode with countdown timer, tab-switch detection, and auto-save so you never lose progress.",
    icon: "⏱️",
  },
  {
    title: "Detailed Analytics",
    desc: "Score breakdown, per-question review, accuracy metrics, and AI-powered explanations for every answer.",
    icon: "📊",
  },
  {
    title: "Search & Discover",
    desc: "Browse hundreds of community tests. Filter by subject, exam, difficulty — find exactly what to practice.",
    icon: "🔍",
  },
  {
    title: "Completely Free",
    desc: "No hidden charges. Upload unlimited papers, take unlimited tests. Education should be accessible to all.",
    icon: "🎯",
  },
];

const exams = [
  {
    name: "JEE Main & Advanced",
    slug: "/jee-mock-test",
    color: "from-blue-500 to-blue-700",
  },
  {
    name: "NEET UG",
    slug: "/neet-mock-test",
    color: "from-green-500 to-green-700",
  },
  {
    name: "WBJEE",
    slug: "/wbjee-mock-test",
    color: "from-purple-500 to-purple-700",
  },
  {
    name: "CUET",
    slug: "/cuet-mock-test",
    color: "from-orange-500 to-orange-700",
  },
  {
    name: "Board Exams (CBSE/WBCHSE)",
    slug: "/register",
    color: "from-rose-500 to-rose-700",
  },
  {
    name: "Other Competitive Exams",
    slug: "/register",
    color: "from-teal-500 to-teal-700",
  },
];

const steps = [
  {
    num: "01",
    title: "Upload Your Paper",
    desc: "Upload any past question paper or practice test in PDF, JPG, or PNG format.",
  },
  {
    num: "02",
    title: "AI Analyzes & Creates Test",
    desc: "Our AI extracts every question, identifies the subject, and builds a timed mock test with all options.",
  },
  {
    num: "03",
    title: "Practice & Improve",
    desc: "Take the test in exam mode, review your answers, and learn from AI-generated explanations.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              FOURI
            </span>
          </Link>
          {/* <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-zinc-900 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all hover:shadow-lg"
            >
              Sign Up Free
            </Link>
          </nav> */}
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/login"
              className="flex items-center justify-center h-[44px] text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="flex items-center justify-center h-[44px] text-sm font-semibold bg-zinc-900 text-white px-5 rounded-xl hover:bg-zinc-800 transition-all hover:shadow-lg"
            >
              Sign Up Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=1920&q=80')",
            }}
          />
          {/* Dark gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-28 sm:pt-28 sm:pb-36">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                AI-Powered Practice Tests — 100% Free
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="text-white">Turn Any Paper Into a</span>
                <br />
                <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">
                  Smart Mock Test
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                Upload past question papers. Our AI instantly extracts
                questions, generates options, and creates timed practice tests
                with detailed explanations. Practice smarter for JEE, NEET,
                WBJEE, CUET & more.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-10 rounded-xl bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started Free
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-10 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 hover:border-white/50 transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                { label: "AI-Generated Tests", value: "500+" },
                { label: "Questions Extracted", value: "10,000+" },
                { label: "Active Students", value: "1,000+" },
                { label: "Subjects Covered", value: "15+" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-24 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
                How It Works
              </h2>
              <p className="mt-4 text-zinc-600 max-w-xl mx-auto">
                Three simple steps to transform any question paper into a
                practice test
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
              {steps.map((step) => (
                <div key={step.num} className="relative text-center group">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-xl font-bold mb-6 group-hover:scale-110 transition-transform">
                    {step.num}
                  </div>
                  {step.num !== "03" && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[calc(80%)] h-px border-t-2 border-dashed border-zinc-300" />
                  )}
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
                Everything You Need to Ace Your Exams
              </h2>
              <p className="mt-4 text-zinc-600 max-w-xl mx-auto">
                A complete platform designed for serious exam preparation
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group p-6 sm:p-8 rounded-2xl border border-zinc-100 bg-white hover:shadow-xl hover:border-zinc-200 transition-all duration-300"
                >
                  <span className="text-3xl mb-4 block">{f.icon}</span>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exam Categories */}
        <section className="py-16 sm:py-24 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
                Practice for Top Exams
              </h2>
              <p className="mt-4 text-zinc-600 max-w-xl mx-auto">
                Upload papers from any exam — AI adapts to the format
                automatically
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {exams.map((exam) => (
                <Link
                  key={exam.name}
                  href={exam.slug}
                  className="group relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-white border border-zinc-100 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${exam.color} transition-opacity`}
                  />
                  <div className="relative">
                    <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-900 transition-colors">
                      {exam.name}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 group-hover:text-zinc-700 transition-colors">
                      Free AI-powered practice →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Start Practicing Today
              </h2>
              <p className="mt-4 text-zinc-300 max-w-lg mx-auto">
                Join thousands of students preparing smarter with AI-powered
                mock tests. Upload your first paper and get an instant practice
                test.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-all hover:shadow-xl"
                >
                  Create Free Account
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-zinc-600 text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                FOURI.IN
              </span>
              <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
                AI-powered mock test platform. Upload papers, generate tests,
                and practice smarter.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 mb-3">Practice</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <Link href="/jee-mock-test" className="hover:text-zinc-900">
                    JEE Mock Tests
                  </Link>
                </li>
                <li>
                  <Link href="/neet-mock-test" className="hover:text-zinc-900">
                    NEET Mock Tests
                  </Link>
                </li>
                <li>
                  <Link href="/wbjee-mock-test" className="hover:text-zinc-900">
                    WBJEE Mock Tests
                  </Link>
                </li>
                <li>
                  <Link href="/cuet-mock-test" className="hover:text-zinc-900">
                    CUET Mock Tests
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <Link href="/register" className="hover:text-zinc-900">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-zinc-900">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/discover" className="hover:text-zinc-900">
                    Discover Tests
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <span className="hover:text-zinc-900 cursor-default">
                    About
                  </span>
                </li>
                <li>
                  <span className="hover:text-zinc-900 cursor-default">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-zinc-900 cursor-default">
                    Terms of Service
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-zinc-200 text-center text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} FOURI.IN. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
