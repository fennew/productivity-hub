import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Productivity Hub",
  description: "Your all-in-one personal productivity dashboard",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <Sidebar />
        <Header />
        <main className="ml-64 pt-14 min-h-screen transition-all duration-300">
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
