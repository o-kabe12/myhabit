// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyHabit App",
  description: "毎日を記録し、自己成長をサポートする習慣トラッカー",
  openGraph: {
    title: "MyHabit App",
    description: "毎日を記録し、自己成長をサポートする習慣トラッカー",
    url: "https://myhabit-dusky.vercel.app/",
    type: "website",
    images: [
      {
        url: "https://myhabit-dusky.vercel.app/ogp.jpg",
        width: 1200,
        height: 630,
        alt: "MyHabit App OGP"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MyHabit App",
    description: "毎日を記録し、自己成長をサポートする習慣トラッカー",
    images: ["https://myhabit-dusky.vercel.app/ogp.jpg"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className + "relative bg-gray-100 min-h-screen bg-gray-100"}>
        <AuthProvider>
          <Header />
          <main
            className="h-[calc(100dvh-76px)] lg:h-[calc(100vh-72px)]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}