import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Aura Commerce — Premium Shopping Experience",
    template: "%s | Aura Commerce",
  },
  description:
    "Discover premium products curated for the modern lifestyle. Shop fashion, electronics, home decor, and more at Aura Commerce.",
  keywords: ["ecommerce", "shopping", "premium", "fashion", "electronics"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Aura Commerce",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Aura Commerce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura Commerce",
    description: "Premium Shopping Experience",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body>
        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a27",
              color: "#f8f8ff",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: "8px",
            },
            success: {
              iconTheme: { primary: "#a855f7", secondary: "#0a0a0f" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#0a0a0f" },
            },
          }}
        />
      </body>
    </html>
  );
}
