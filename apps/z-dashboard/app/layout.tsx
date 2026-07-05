import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Z Ecosystem — Chain · Wallet · Bank · Swap · Trade · Chart",
  description: "Binance-style production stack for Z Chain, Z Wallet, Z Bank, Z Swap, Z Trade, and Z Chart"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
