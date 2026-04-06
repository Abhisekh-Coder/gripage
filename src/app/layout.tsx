import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GripAge — Grip Strength & Biological Age",
  description: "Discover your biological age through grip strength science. Backed by population-level research.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#080e1a] text-[#e5e2e1] antialiased">
        {children}
      </body>
    </html>
  );
}
