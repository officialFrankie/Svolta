import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";
import TabBar from "@/components/TabBar";
import Header from "@/components/Header";
import { AppProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SVOLTA",
  description: "Il quartier generale di Francesco — health & life coaching",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SVOLTA",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#101318",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={`${inter.className} min-h-screen bg-bg text-ink antialiased`}>
        <AppProvider>
          <div className="mx-auto grid max-w-[560px] gap-3 px-4 pb-[104px] pt-5">
            <Header />
            {children}
          </div>
          <TabBar />
        </AppProvider>
        <SWRegister />
      </body>
    </html>
  );
}
