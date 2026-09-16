import type { Metadata } from "next";
import { WalletProvider } from "@/context/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgenticID",
  description: "Agent profiles, job records, and ratings on BOT Chain Testnet",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
