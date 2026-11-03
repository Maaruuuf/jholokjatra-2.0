import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/lib/app-context";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "JholokJatra · Bangladesh best-day-to-go",
  description: "Explore Bangladesh on a map, mark places you've visited, and find the best day to go using live public data.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const themeInit = `try{var t=localStorage.getItem('jj-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body>
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-3 neu-btn">Skip to content</a>
          <Nav />
          <main id="main" className="p-3 max-w-[1500px] mx-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
