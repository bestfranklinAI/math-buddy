import type { Metadata } from "next";
import { Fredoka } from 'next/font/google';
import Script from 'next/script';
import "./globals.css";

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Math Buddy - Fun Math Learning for ADHD & Dyslexic Students",
  description: "Interactive AI-powered math tutor with themed questions, chat help, and visual aids. Perfect for neurodivergent learners.",
  keywords: "math, education, ADHD, dyslexic, AI tutor, interactive learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.className} antialiased`}>
        {/* OpenCV.js for enhanced motion detection */}
        <Script 
          src="https://docs.opencv.org/4.8.0/opencv.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
