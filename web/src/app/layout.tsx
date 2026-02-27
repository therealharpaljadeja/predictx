import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "sonner";
import { Web3Provider } from "@/providers/web3-provider";
import { Header } from "@/components/layout/header";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PredictX - Prediction Markets on Base",
  description: "Bet on X/Twitter follower milestones with USDC on Base Sepolia",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} antialiased`}
      >
        <Web3Provider cookies={cookies}>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0A0A0A",
                border: "1px solid #1C1C1C",
                color: "#F0F0F0",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "12px",
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
