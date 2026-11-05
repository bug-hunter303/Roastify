import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roastify",
  description: "Get roasted based on your YouTube watch history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}