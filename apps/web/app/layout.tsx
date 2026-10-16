import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "CatchMusic",
  description: "Listen to your favorite music anytime, anywhere.",
  icons: {
    icon: "/cm circular.png",
    apple: "/cm circular.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-primary`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
