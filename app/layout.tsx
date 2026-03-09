import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreakStrike",
  description: "Private habit discipline tracker",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
