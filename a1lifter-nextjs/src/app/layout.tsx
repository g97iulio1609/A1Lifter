import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A1Lifter - Sports Competition Management Platform",
  description: "Modern platform for managing powerlifting, weightlifting, strongman, and fitness competitions",
  keywords: ["powerlifting", "weightlifting", "strongman", "competition", "sports management"],
  authors: [{ name: "A1Lifter Team" }],
  openGraph: {
    title: "A1Lifter - Sports Competition Management",
    description: "Modern platform for managing strength sports competitions",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
