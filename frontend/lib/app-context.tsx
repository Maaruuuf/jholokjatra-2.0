"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CATEGORY, Lang, t as translate } from "./i18n";

type Theme = "light" | "dark";
interface Ctx {
  lang: Lang; setLang: (l: Lang) => void;
  theme: Theme; setTheme: (t: Theme) => void;
  userId: string; ready: boolean;
  t: (key: string) => string;
  name: (p: { name: string; name_bn: string }) => string;
  cat: (c: string) => { label: string; emoji: string };
}
const AppCtx = createContext<Ctx | null>(null);

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 18) : `u${Date.now()}`;
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("light");
  const [userId, setUserId] = useState("default");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const l = (localStorage.getItem("jj-lang") as Lang) || "en";
    const th = (document.documentElement.dataset.theme as Theme) || "light";
    let u = localStorage.getItem("jj-user");
    if (!u) { u = newId(); localStorage.setItem("jj-user", u); }
    setLangState(l); setThemeState(th); setUserId(u); setReady(true);
  }, []);

  const setLang = useCallback((l: Lang) => { setLangState(l); localStorage.setItem("jj-lang", l); document.documentElement.lang = l; }, []);
  const setTheme = useCallback((th: Theme) => { setThemeState(th); localStorage.setItem("jj-theme", th); document.documentElement.dataset.theme = th; }, []);

  const value = useMemo<Ctx>(() => ({
    lang, setLang, theme, setTheme, userId, ready,
    t: (k) => translate(k, lang),
    name: (p) => (lang === "bn" ? p.name_bn : p.name),
    cat: (c) => ({ label: CATEGORY[c]?.[lang] ?? c, emoji: CATEGORY[c]?.emoji ?? "📍" }),
  }), [lang, theme, userId, ready, setLang, setTheme]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be used inside <Providers>");
  return v;
}
