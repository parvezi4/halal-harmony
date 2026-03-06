import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halal Harmony – Serious halal matrimony",
  description:
    "Halal Harmony is a Muslim matrimonial platform focused on serious, halal marriage, guided by Islamic values."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}

