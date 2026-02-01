import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "吃啥AI - 你的美食灵感助手",
  description: "不知道吃什么？拍冰箱、选标签，AI 帮你做决定！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        <main className="relative min-h-screen overflow-hidden">
           {/* Background Decoration */}
           <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[120px]" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary blur-[120px]" />
           </div>
           {children}
        </main>
      </body>
    </html>
  );
}
