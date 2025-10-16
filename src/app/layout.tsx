import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LayoutContent } from "@/components/layout-content";
import SipKeeper from "@/components/dialer/SipKeeper";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRMS - Human Resource Management System",
  description: "Comprehensive HR management system with role-based access",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Keeps SIP registered across routes until explicit SIP logout */}
        <SipKeeper />
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
