import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://codeatlas.dev"),
  title: {
    default: "CodeAtlas — AI-Powered Codebase Intelligence Platform",
    template: "%s | CodeAtlas",
  },
  description: "Understand any codebase. Trace every connection. Photograph code, connect a repo, and follow any function through files, APIs, and tests with receipts.",
  keywords: [
    "codebase intelligence",
    "architecture graph",
    "AST code parser",
    "symbol navigation",
    "workflow trace",
    "code review AI",
    "developer productivity",
  ],
  openGraph: {
    title: "CodeAtlas — Understand any codebase. Trace every connection.",
    description: "Explore unfamiliar repositories, inspect caller/callee trees, trace multi-tier workflows, and review pull requests with verified source receipts.",
    type: "website",
    siteName: "CodeAtlas",
    url: "https://codeatlas.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeAtlas — AI-Powered Codebase Intelligence Platform",
    description: "Understand any codebase. Trace every connection with verified receipts.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('codeatlas-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-[#6C4DFF]/20 selection:text-[#6C4DFF] dark:selection:bg-[#29D3C2]/20 dark:selection:text-[#29D3C2]">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
