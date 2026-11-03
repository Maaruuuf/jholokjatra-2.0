"use client";
import { useEffect, useState } from "react";
import { API, api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { Health, Preferences } from "@/lib/types";
import { Button, Card, Chip, ErrorBanner, Toggle } from "@/components/ui";

const DEFAULT: Preferences = { risk_tolerance: "medium", motion_sickness: false, traveling_with_kids: false, elderly_travelers: false };

export default function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, userId, ready } = useApp();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT);
  const [health, setHealth] = useState<Health | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    api.getPrefs(userId).then(setPrefs).catch((e: Error) => setError(e.message));
    api.health().then(setHealth).catch(() => undefined);
  }, [ready, userId]);

  async function save() {
    try { setPrefs(await api.putPrefs(userId, prefs)); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e) { setError((e as Error).message); }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <Card>
        <h1 className="text-xl font-extrabold mb-3">{t("prefs")}</h1>
        <p className="text-sm text-muted mb-2">{t("risk")}</p>
        <div className="flex gap-2 mb-3" role="group" aria-label={t("risk")}>
          {(["low", "medium", "high"] as const).map((r) => <Chip key={r} pressed={prefs.risk_tolerance === r} onClick={() => setPrefs({ ...prefs, risk_tolerance: r })}>{t(r)}</Chip>)}
        </div>
        <Toggle label={t("motion")} checked={prefs.motion_sickness} onChange={(v) => setPrefs({ ...prefs, motion_sickness: v })} />
        <Toggle label={t("kids")} checked={prefs.traveling_with_kids} onChange={(v) => setPrefs({ ...prefs, traveling_with_kids: v })} />
        <Toggle label={t("elderly")} checked={prefs.elderly_travelers} onChange={(v) => setPrefs({ ...prefs, elderly_travelers: v })} />
        <div className="mt-3 flex items-center gap-3"><Button primary onClick={save}>{t("save")}</Button>{saved && <span role="status" className="text-sm" style={{ color: "var(--go)" }}>✓ {t("saved")}</span>}</div>
      </Card>
      <Card>
        <p className="text-sm text-muted mb-2">{t("language")}</p>
        <div className="flex gap-2 mb-4"><Chip pressed={lang === "en"} onClick={() => setLang("en")}>English</Chip><Chip pressed={lang === "bn"} onClick={() => setLang("bn")}>বাংলা</Chip></div>
        <p className="text-sm text-muted mb-2">{t("theme")}</p>
        <div className="flex gap-2"><Chip pressed={theme === "light"} onClick={() => setTheme("light")}>☀️ {t("light")}</Chip><Chip pressed={theme === "dark"} onClick={() => setTheme("dark")}>🌙 {t("dark")}</Chip></div>
      </Card>
      <Card inset>
        <h2 className="font-bold mb-2">Status</h2>
        <p className="text-sm">API: <code>{API}</code> {health ? "✅" : "❌"}</p>
        {health && <p className="text-sm">v{health.version} · LLM: {health.llm_providers.join(", ")}</p>}
        <p className="text-sm break-all">User ID (this browser): <code>{userId}</code></p>
        <p className="text-xs text-muted mt-1">Your visits and preferences are stored on the backend under this browser&apos;s ID. Clearing site data creates a new ID.</p>
      </Card>
    </div>
  );
}
