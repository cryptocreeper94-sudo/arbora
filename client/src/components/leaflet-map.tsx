import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  popup?: string;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  style?: React.CSSProperties;
}

export default function LeafletMap({ center, zoom = 10, markers = [], className = "", style }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(map);

    const icon = L.divIcon({
      className: "custom-marker",
      html: '<div style="width:24px;height:24px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      if (m.popup) marker.bindPopup(m.popup);
      else if (m.title) marker.bindPopup(`<b>${m.title}</b>`);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom, markers]);

  return <div ref={mapRef} className={className} style={{ minHeight: 300, ...style }} data-testid="leaflet-map" />;
}
