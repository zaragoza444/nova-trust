import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Nova Trust Digital Finance",
  description: "Permissioned EVM explorer and digital finance control center"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
