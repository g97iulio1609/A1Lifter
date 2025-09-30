import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "A1Lifter - Competition Management Platform",
  description: "Multisport competition management platform for powerlifting, weightlifting, strongman, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased bg-white text-gray-900">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
