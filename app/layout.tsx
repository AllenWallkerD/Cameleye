import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Cameleye — An eye on your money",
  description: "Personal finance tracker · income, expenses, goals",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('cameleye.theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
