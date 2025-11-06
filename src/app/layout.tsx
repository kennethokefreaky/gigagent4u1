import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "../contexts/NotificationContext";
import { UserProvider } from "../contexts/UserContext";
import { MessageBadgeProvider } from "../contexts/MessageBadgeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "GA4U - GigAgent4U",
  description: "Your gateway to freelance opportunities",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <UserProvider>
          <NotificationProvider>
            <MessageBadgeProvider>
              {children}
            </MessageBadgeProvider>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
