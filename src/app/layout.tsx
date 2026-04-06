import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GripAge — Grip Strength & Biological Age",
  description: "Measure your grip strength and discover your biological age",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#e8e0f4] text-[#1a1a3e] antialiased">
        {children}
      </body>
    </html>
  );
}
