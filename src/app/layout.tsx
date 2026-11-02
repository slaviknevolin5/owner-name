import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const unbounded = localFont({
  src: [
    { path: "../fonts/Unbounded-500.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Unbounded-600.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Unbounded-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-unbounded",
  display: "swap",
});

const manrope = localFont({
  src: [
    { path: "../fonts/Manrope-400.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Manrope-500.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Manrope-600.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Manrope-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Голосование Олимпиады — КГУ «Школа-гимназия № 118» г.Алматы",
  description:
    "Голосование за кандидатов Олимпиады, КГУ «Школа-гимназия № 118» г.Алматы — один голос с устройства",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${unbounded.variable} ${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
