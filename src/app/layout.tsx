import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getServerSession } from "next-auth";
import SessionProvider from "@/components/SessionProvider";
import { Albert_Sans, Cantarell, Roboto, Roboto_Serif } from "next/font/google";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const albertSans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-albert-sans",
  display: "swap",
});

const cantarell = Cantarell({
  subsets: ["latin"],
  variable: "--font-cantarell",
  display: "swap",
  weight: "400",
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
  weight: "400",
});
const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
  variable: "--font-roboto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TotalPlus",
  description: "Creado por ZPF Sistemas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${robotoSerif.variable} antialiased`}
      >
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
