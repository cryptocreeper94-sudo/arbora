import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, Droplets, Search, MapPin, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country?: string;
}

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10: number;
    weather_code: number;
  };
}

function getWeatherInfo(code: number): { icon: typeof Sun; label: string } {
  if (code === 0) return { icon: Sun, label: "Clear Sky" };
  if (code >= 1 && code <= 3) return { icon: Cloud, label: "Partly Cloudy" };
  if (code >= 45 && code <= 48) return { icon: Cloud, label: "Foggy" };
  if (code >= 51 && code <= 67) return { icon: CloudRain, label: "Drizzle / Rain" };
  if (code >= 71 && code <= 77) return { icon: Snowflake, label: "Snow" };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: "Rain Showers" };
  if (code >= 95 && code <= 99) return { icon: CloudLightning, label: "Thunderstorm" };
  return { icon: Cloud, label: "Cloudy" };
}

function WeatherIcon({ code }: { code: number }) {
  const { icon: Icon } = getWeatherInfo(code);

  if (code === 0) {
    return <Icon className="w-12 h-12 text-amber-400" />;
  }
  if (code >= 1 && code <= 3) {
    return (
      <div className="relative">
        <Sun className="w-12 h-12 text-amber-400" />
        <Cloud className="w-8 h-8 text-slate-400 absolute -bottom-1 -right-2" />
      </div>
    );
  }
  if (code >= 71 && code <= 77) {
    return <Icon className="w-12 h-12 text-sky-300" />;
  }
  if (code >= 95 && code <= 99) {
    return <Icon className="w-12 h-12 text-yellow-400" />;
  }
  return <Icon className="w-12 h-12 text-slate-400" />;
}

async function fetchGeocode(city: string): Promise<GeoResult> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error(`City "${city}" not found`);
  return data.results[0];
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`
  );
  if (!res.ok) throw new Error("Weather request failed");
  return res.json();
}

async function fetchWeatherByCity(city: string) {
  const geo = await fetchGeocode(city);
  const weather = await fetchWeather(geo.latitude, geo.longitude);
  return { geo, weather };
}

export function WeatherWidget() {
  const [city, setCity] = useState("Asheville");
  const [searchInput, setSearchInput] = useState("");
  const [usingGeo, setUsingGeo] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setUsingGeo(true);
        },
        () => {}
      );
    }
  }, []);

  const cityQuery = useQuery({
    queryKey: ["weather-city", city],
    queryFn: () => fetchWeatherByCity(city),
    enabled: !usingGeo,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const geoQuery = useQuery({
    queryKey: ["weather-geo", coords?.lat, coords?.lng],
    queryFn: async () => {
      if (!coords) throw new Error("No coords");
      const weather = await fetchWeather(coords.lat, coords.lng);
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=&count=1&latitude=${coords.lat}&longitude=${coords.lng}`
      );
      let locationName = "Your Location";
      try {
        const reverseRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m&timezone=auto`
        );
        const reverseData = await reverseRes.json();
        if (reverseData.timezone) {
          const parts = reverseData.timezone.split("/");
          locationName = parts[parts.length - 1].replace(/_/g, " ");
        }
      } catch {}
      return {
        geo: { latitude: coords.lat, longitude: coords.lng, name: locationName } as GeoResult,
        weather,
      };
    },
    enabled: usingGeo && !!coords,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const activeQuery = usingGeo ? geoQuery : cityQuery;
  const { data, isLoading, isError, error } = activeQuery;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setUsingGeo(false);
      setCity(trimmed);
      setSearchInput("");
    }
  };

  const displayLocation = data
    ? `${data.geo.name}${data.geo.admin1 ? `, ${data.geo.admin1}` : ""}`
    : usingGeo
      ? "Locating..."
      : city;

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-amber-400/10 backdrop-blur-xl border border-white/20 p-6"
      data-testid="weather-widget"
    >
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground/80" data-testid="text-weather-branding">
          DarkWave Weather
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span data-testid="text-weather-location">{displayLocation}</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search city..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            data-testid="input-weather-city"
          />
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3" data-testid="weather-loading">
          <div className="flex items-center gap-5">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 py-4" data-testid="weather-error">
          <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground/80">Unable to load weather</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {error instanceof Error ? error.message : "Please try again"}
            </p>
          </div>
        </div>
      ) : data ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${data.geo.latitude}-${data.geo.longitude}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-5">
              <WeatherIcon code={data.weather.current.weather_code} />
              <div>
                <div className="text-3xl font-bold text-foreground" data-testid="text-weather-temp">
                  {Math.round(data.weather.current.temperature_2m)}&deg;F
                </div>
                <div className="text-sm text-muted-foreground mt-0.5" data-testid="text-weather-condition">
                  {getWeatherInfo(data.weather.current.weather_code).label}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground" data-testid="text-weather-wind">
                  {Math.round(data.weather.current.wind_speed_10)} mph
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground" data-testid="text-weather-humidity">
                  {data.weather.current.relative_humidity_2m}%
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
