import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Cameleye — An eye on your money",
  description: "Personal finance tracker · income, expenses, goals",
  appleWebApp: { capable: true, title: "Cameleye", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('cameleye.theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />
        <AppProvider>{children}</AppProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
