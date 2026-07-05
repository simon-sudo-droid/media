import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { CursorMotion } from "@/components/cursor-motion";

export const metadata: Metadata = {
  title: "EditMentor AI — Become a world-class video editor",
  description:
    "Learn, practice, and level up your editing with AI coaching, quizzes, and challenges.",
};

// Applied before paint to avoid a theme flash. Defaults to dark (brand look).
const themeScript = `(function(){try{var t=localStorage.getItem('em-theme')||'dark';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <CursorMotion />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
