import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChainRoute – Verified Micro-Donations for Local Relief | MST Blockchain",
  description:
    "Cryptographically verified, append-only disaster relief micro-donation platform on India's Layer 1 MST Blockchain with BridgeKey wallet integration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
