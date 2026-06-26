import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBrand } from "@/lib/data";
import { CartProvider } from "@/lib/cart/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

const body = Nunito({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Quicksand({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const brand = await getBrand();
  const l = isLocale(locale) ? locale : "de";
  const dict = getDictionary(l);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: `${brand.name} – ${dict.home.heroTitle}`, template: `%s · ${brand.name}` },
    description: dict.home.heroSubtitle,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);
  const brand = await getBrand();

  return (
    <html lang={l} className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Header locale={l} dict={dict} brand={brand.name} />
          <main className="flex-1">{children}</main>
          <Footer locale={l} dict={dict} brand={brand.name} />
          <ChatWidget locale={l} dict={dict} />
        </CartProvider>
      </body>
    </html>
  );
}
