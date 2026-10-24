import { Geist, Geist_Mono } from "next/font/google";
import "./tuai.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function TuaiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className={`tuai ${geist.variable} ${geistMono.variable}`}>
      {children}
    </div>
  );
}
