import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/cart-context";
import CartPanel from "@/components/CartPanel";
import { CustomerSupportAgent } from "@/components/CustomerSupportAgent";
import AppearanceProvider from "@/components/AppearanceProvider";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Console Zone | Buy, Sell & Rent PS5, Xbox, Switch & PC Gear",
  description: "India's most trusted gaming ecosystem. Buy & Sell New or Pre-owned Consoles, Games, and PC Components. Instant cash, store credit, and premium rentals.",
};

import { VisualsProvider } from "@/context/visuals-context";
import LayoutAnimator from "@/components/layout/LayoutAnimator";
import { Suspense } from "react";

function LoadingFallback() {
  return <div className="fixed inset-0 bg-[#050505] z-[9999]" />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <VisualsProvider>
          <CartProvider>
            <AppearanceProvider>
              <Navbar />
              <Suspense fallback={<LoadingFallback />}>
                <LayoutAnimator>
                  {children}
                </LayoutAnimator>
              </Suspense>
              <Footer />
              <CustomerSupportAgent />
              <CartPanel />
            </AppearanceProvider>
          </CartProvider>
        </VisualsProvider>
      </body>
    </html>
  );
}
