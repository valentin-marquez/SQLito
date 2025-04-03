import { cn } from "@/_lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { JetBrains_Mono as FontMono } from "next/font/google";
import "@/_styles/globals.css";
import { ThemeProvider } from "@/_components/theme-provider";
import { Toaster } from "@/_components/ui/sonner";

// Font configuration
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SQLito - Business Intelligence for Tech-Challenged Bosses",
  description: "Turn Spanish questions into Supabase reports using AI. No SQL knowledge required!",
  keywords: ["Supabase", "AI", "SQL", "Business Intelligence", "Model Context Protocol", "SQLito"],
  authors: [{ name: "SQLito Team" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "SQLito - Business Intelligence for Tech-Challenged Bosses",
    description:
      "Turn Spanish questions into Supabase reports using AI. No SQL knowledge required!",
    type: "website",
    siteName: "SQLito",
  },
  twitter: {
    card: "summary_large_image",
    title: "SQLito - Business Intelligence for Tech-Challenged Bosses",
    description:
      "Turn Spanish questions into Supabase reports using AI. No SQL knowledge required!",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-sidebar font-mono antialiased",
          fontSans.variable,
          fontMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="relative flex min-h-screen flex-col">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
