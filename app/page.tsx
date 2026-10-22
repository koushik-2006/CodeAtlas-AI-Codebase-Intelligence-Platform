"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import City from "@/components/City";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { ArrowRight, Sparkles, Terminal, Shield, GitBranch, Layers, Search, Eye } from "lucide-react";

const langsLight = [
  "Python", "TypeScript", "Java", "Go", "Rust", "C++", "JavaScript", "Ruby", "PHP", "Kotlin",
];

const tokensDark = [
  "def", "=>", "{ }", "import", "fn()", "0x1F", "git", "SELECT", "async", "interface", "struct", "class"
];

const chipLight = ["bg-lilac text-[#19143D]", "bg-rose text-[#19143D]", "bg-sunsoft text-[#19143D]", "bg-mintsoft text-[#19143D]"];

export default function Landing() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features = isDark
    ? [
        {
          num: "01",
          title: "Visual Code Explorer",
          desc: "Paste, snap or upload code. Fix the extraction, then explain it or trace it across the repo.",
          icon: Eye,
          span: "md:col-span-4",
          tag: "OCR + CodeLens",
        },
        {
          num: "02",
          title: "AI with receipts",
          desc: "Every answer cites files and lines with verified source evidence beside every response.",
          icon: Sparkles,
          span: "md:col-span-2",
          tag: "Verified Sources",
        },
        {
          num: "03",
          title: "Architecture graph",
          desc: "Real relationships, parsed from your code between functions, APIs, and tests.",
          icon: GitBranch,
          span: "md:col-span-2",
          tag: "Call Graphs",
        },
        {
          num: "04",
          title: "Change impact",
          desc: "See what might break before you edit. Identify high-risk ripple effects instantly.",
          icon: Layers,
          span: "md:col-span-2",
          tag: "Dependency Analysis",
        },
        {
          num: "05",
          title: "Semantic search",
          desc: "Describe a feature or business behavior in plain language to locate the exact code.",
          icon: Search,
          span: "md:col-span-2",
          tag: "Embeddings",
        },
        {
          num: "06",
          title: "Private by design",
          desc: "Tokens stay on the server. Repositories are processed securely with zero training on your code.",
          icon: Shield,
          span: "md:col-span-4",
          tag: "Enterprise Security",
        },
      ]
    : [
        {
          num: "01",
          title: "Visual Code Explorer",
          desc: "Photograph or paste code. We read it, you fix it, then explain it or trace it through the whole city.",
          icon: Eye,
          span: "md:col-span-4",
          color: "bg-lilac border-[#E8E5F4]",
        },
        {
          num: "02",
          title: "AI with receipts",
          desc: "Every answer links to files and lines with transparent citations.",
          icon: Sparkles,
          span: "md:col-span-2",
          color: "bg-rose border-[#E8E5F4]",
        },
        {
          num: "03",
          title: "Architecture map",
          desc: "Real roads between functions, APIs, microservices, and tests.",
          icon: GitBranch,
          span: "md:col-span-2",
          color: "bg-mintsoft border-[#E8E5F4]",
        },
        {
          num: "04",
          title: "Change impact",
          desc: "See which buildings a change can shake before writing a single line.",
          icon: Layers,
          span: "md:col-span-2",
          color: "bg-sunsoft border-[#E8E5F4]",
        },
        {
          num: "05",
          title: "Semantic search",
          desc: "Describe it in natural English, and we find the exact address.",
          icon: Search,
          span: "md:col-span-2",
          color: "bg-white border-[#E8E5F4]",
        },
        {
          num: "06",
          title: "Private by design",
          desc: "Protected tokens and private indexing. Your code remains confidential.",
          icon: Shield,
          span: "md:col-span-4",
          color: "bg-lilac/50 border-[#E8E5F4]",
        },
      ];

  const steps = isDark
    ? [
        { step: "STEP 1", title: "Connect", desc: "Public repo, ZIP or authorized GitHub.", badge: "bg-[#29D3C2]/15 text-[#29D3C2] border border-[#29D3C2]/30" },
        { step: "STEP 2", title: "Analyze", desc: "Symbols parsed, relationships indexed.", badge: "bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30" },
        { step: "STEP 3", title: "Explore", desc: "Ask, browse, graph, check impact.", badge: "bg-[#F3C969]/15 text-[#F3C969] border border-[#F3C969]/30" },
      ]
    : [
        { step: "1", title: "Connect", desc: "Public repo, ZIP or GitHub.", badge: "bg-sun text-[#19143D]" },
        { step: "2", title: "Analyze", desc: "We parse every symbol and road.", badge: "bg-mint text-[#19143D]" },
        { step: "3", title: "Explore", desc: "Ask, browse, trace, check impact.", badge: "bg-coral text-white" },
      ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 mx-auto flex max-w-6xl items-center justify-between px-5 py-4 backdrop-blur-md bg-[var(--bg-page)]/85 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="CodeAtlas Home">
            <Logo />
          </Link>
          <div className="hidden gap-6 text-sm font-semibold text-[var(--text-secondary)] md:flex">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#steps" className="hover:text-[var(--text-primary)] transition-colors">How it works</a>
            <a href="#about" className="hover:text-[var(--text-primary)] transition-colors">About</a>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-bold">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden sm:inline-block px-4 py-2 rounded-full hover:bg-[var(--border-color)]/30 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm active:scale-95 ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] shadow-[0_0_20px_-5px_rgba(41,211,194,0.4)]"
                : "bg-[#19143D] text-white hover:bg-[#2a225f]"
            }`}
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:pt-14">
        <div>
          {isDark ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-[#0D111B] border border-[#242B39] px-3 py-1 font-mono text-xs tracking-wider text-[#29D3C2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#29D3C2] animate-pulse" />
              / / A M A P F O R Y O U R S O U R C E C O D E
            </div>
          ) : (
            <span className="inline-block -rotate-2 rounded-lg bg-sun px-3.5 py-1 font-mono text-xs font-bold text-[#19143D] shadow-sm">
              your repo, built as a city
            </span>
          )}

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl lg:text-[68px]">
            Understand any codebase.{" "}
            <span className={isDark ? "text-transparent bg-clip-text bg-gradient-to-r from-[#29D3C2] to-[#8B7CFF]" : "text-[#6C4DFF]"}>
              Trace every connection.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg font-medium text-[var(--text-secondary)] leading-relaxed">
            {isDark
              ? "Photograph code, connect a repo, and follow any function through files, APIs and tests, with the evidence beside every answer."
              : "Every file becomes a building and every call becomes a road. Walk through your code, snap a screenshot, and ask questions backed by real sources."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className={`inline-flex items-center gap-3 px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${
                isDark
                  ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] shadow-[0_0_25px_-5px_rgba(41,211,194,0.4)]"
                  : "bg-[#19143D] text-white hover:bg-[#291f63]"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
              </svg>
              Get started with Google
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-all"
            >
              Explore features
            </a>
          </div>
        </div>

        {/* Hero Interactive Illustration */}
        <figure className="relative">
          <div className="overflow-hidden rounded-3xl p-3 border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-soft">
            <City className="w-full" />
          </div>
          <figcaption className="mt-3 text-center font-mono text-xs text-[var(--text-secondary)]">
            {isDark
              ? "Illustrative route. Real graphs come from your repository."
              : "Illustrative city. Yours is generated from your repository."}
          </figcaption>
        </figure>
      </header>

      {/* Language / Keyword Marquee Strip */}
      <div className="overflow-hidden border-y border-[var(--border-color)] py-3.5 bg-[var(--bg-surface)]/50" aria-hidden>
        <div className="flex w-max animate-marquee gap-4">
          {(isDark ? [...tokensDark, ...tokensDark, ...tokensDark] : [...langsLight, ...langsLight, ...langsLight]).map((item, i) => (
            <span
              key={i}
              className={`rounded-full px-4 py-1.5 font-mono text-xs font-semibold ${
                isDark
                  ? "bg-[#0D111B] border border-[#242B39] text-[#29D3C2]"
                  : chipLight[i % 4]
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            Platform Capabilities
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl">
            {isDark ? "Everything to navigate unfamiliar code" : "A city planner for your code"}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <article
                key={feat.title}
                className={`${feat.span} app-card p-7 transition-all duration-300 hover:-translate-y-1 ${
                  !isDark && "color" in feat ? (feat as any).color : ""
                } ${
                  isDark
                    ? "bg-[#0D111B] border-[#242B39] hover:border-[#29D3C2]/50 hover:shadow-[0_0_25px_-5px_rgba(41,211,194,0.15)]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                    {feat.num}
                  </span>
                  <div className={`p-2.5 rounded-xl ${isDark ? "bg-[#111725] text-[#29D3C2]" : "bg-white/80 text-[#6C4DFF]"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{feat.title}</h3>
                <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                  {feat.desc}
                </p>
                {"tag" in feat && (
                  <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-wider text-[#29D3C2] bg-[#29D3C2]/10 px-2 py-0.5 rounded">
                    {(feat as any).tag}
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="steps" className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            Workflow Architecture
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            {isDark ? "Connect. Analyze. Understand." : "Three steps to your first map"}
          </h2>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.title}
              className={`app-card p-7 transition-all duration-200 hover:-translate-y-1 ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <span className={`inline-grid px-3 py-1 rounded-lg font-mono text-xs font-bold ${s.badge}`}>
                {s.step}
              </span>
              <h3 className="mt-5 text-2xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Banner Section */}
      <section id="about" className="mx-auto max-w-6xl px-5 py-12">
        <div
          className={`flex flex-wrap items-center justify-between gap-8 rounded-3xl p-10 md:p-14 transition-all ${
            isDark
              ? "bg-[#0D111B] border border-[#242B39] shadow-[0_0_40px_-10px_rgba(41,211,194,0.15)]"
              : "bg-[#19143D] text-white shadow-soft"
          }`}
        >
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold leading-tight md:text-4xl text-white">
              {isDark
                ? "For students, new hires and teams inheriting legacy code."
                : "Made for students, new hires and anyone inheriting legacy code."}
            </h2>
            <p className="mt-3 text-sm md:text-base font-medium text-white/70">
              Start navigating code visually with verified citations. No guesswork, no outdated wikis.
            </p>
          </div>
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm transition-transform active:scale-95 shadow-md ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-sun text-[#19143D] hover:bg-[#ffd166]"
            }`}
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[var(--border-color)] px-5 py-10 text-xs font-semibold text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} CodeAtlas. Built for codebase intelligence.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="hover:text-[var(--text-primary)]">Docs</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)]">GitHub</a>
          <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
          <Link href="/contact" className="hover:text-[var(--text-primary)]">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
