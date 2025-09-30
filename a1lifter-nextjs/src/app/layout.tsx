import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A1Lifter - Powerlifting Competition Management",
  description: "Professional powerlifting and strongman competition management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
