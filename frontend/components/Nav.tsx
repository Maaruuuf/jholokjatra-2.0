"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app-context";

const LINKS = [
  { href: "/", key: "explore", icon: "🗺️" },
  { href: "/visits", key: "myVisits", icon: "✅" },
  { href: "/compare", key: "compare", icon: "⚖️" },
  { href: "/settings", key: "settings", icon: "⚙️" },
];

export default function Nav() {
  const path = usePathname();
  const { t, lang, setLang, theme, setTheme } = useApp();
  return (
    <header className="neu m-3 mb-0 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
      <Link href="/" className="text-xl font-extrabold tracking-tight" aria-label={t("appName")}>
        🧭 {t("appName")}
      </Link>
      <nav className="flex flex-wrap gap-2" aria-label="Main">
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
              className={`neu-btn !py-2 !px-3 text-sm ${active ? "is-active" : ""}`}>
              <span aria-hidden>{l.icon}</span> {t(l.key)}
            </Link>
          );
        })}
      </nav>
      <div className="flex gap-2">
        <button className="neu-btn !py-2 !px-3 text-sm" onClick={() => setLang(lang === "en" ? "bn" : "en")} aria-label="Switch language">
          {lang === "en" ? "বাংলা" : "EN"}
        </button>
        <button className="neu-btn !py-2 !px-3 text-sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
}
