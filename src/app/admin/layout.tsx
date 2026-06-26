import "../globals.css";
import { Nunito, Quicksand } from "next/font/google";

const body = Nunito({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Quicksand({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

export const metadata = { title: "Coloreo Admin" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full bg-paper">{children}</body>
    </html>
  );
}
