import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BNS Online Shop",
  description: "Premium Retail Intelligence System",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black text-white selection:bg-white selection:text-black">
      <body className={`${inter.className} antialiased no-scrollbar`}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}