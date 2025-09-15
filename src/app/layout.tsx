import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "../contexts/NotificationContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "GA4U - GigAgent4U",
  description: "Your gateway to freelance opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
