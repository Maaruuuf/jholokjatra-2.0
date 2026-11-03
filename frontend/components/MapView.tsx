"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap, LayerGroup } from "leaflet";
import type { Place } from "@/lib/types";
import { CATEGORY } from "@/lib/i18n";

interface Props {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const BD_BOUNDS: [[number, number], [number, number]] = [[20.5, 88.0], [26.7, 92.8]];

export default function MapView({ places, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // create the map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default as unknown as typeof import("leaflet");
      if (cancelled || !el.current || map.current) return;
      leaflet.current = L;
      const m = L.map(el.current, { zoomControl: true, minZoom: 6, maxBounds: [[18.5, 86.0], [28.5, 94.5]], maxBoundsViscosity: 0.8 });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      m.fitBounds(BD_BOUNDS);
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      setTimeout(() => m.invalidateSize(), 50);
      render();
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function render() {
    const L = leaflet.current, g = layer.current;
    if (!L || !g) return;
    g.clearLayers();
    places.forEach((p) => {
      const sel = p.id === selectedId ? "is-selected" : "";
      const icon = L.divIcon({
        className: "", iconSize: [38, 38], iconAnchor: [19, 19],
        html: `<div class="jj-pin st-${p.status} ${sel}" role="img" aria-label="${p.name}">${CATEGORY[p.category]?.emoji ?? "📍"}</div>`,
      });
      const marker = L.marker([p.lat, p.lon], { icon, title: p.name, keyboard: true, riseOnHover: true });
      marker.on("click", () => onSelectRef.current(p.id));
      marker.addTo(g);
    });
  }

  useEffect(render, [places, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = places.find((x) => x.id === selectedId);
    if (p && map.current) map.current.flyTo([p.lat, p.lon], Math.max(map.current.getZoom(), 9), { duration: 0.8 });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="h-full w-full" aria-label="Map of Bangladesh with places" />;
}
