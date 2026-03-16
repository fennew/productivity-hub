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
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased overflow-x-hidden`}>
        <Sidebar />
        <Header />
        <main className="pt-14 pb-20 md:pb-0 min-h-screen transition-all duration-300 md:ml-64 w-full md:w-auto">
          <div className="px-3 py-4 md:p-6 max-w-full overflow-x-hidden">{children}</div>
        </main>
      </body>
    </html>
  );
}
