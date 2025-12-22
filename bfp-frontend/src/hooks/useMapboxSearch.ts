// src/hooks/useMapboxSearch.ts
import { useState, useCallback } from 'react';

export type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [longitude, latitude]
  place_type: string[];
  properties: {
    mapbox_id?: string;
  };
};

type MapboxResponse = {
  features: MapboxFeature[];
};

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export function useMapboxSearch() {
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setResults([]);
      return;
    }

    if (!MAPBOX_ACCESS_TOKEN) {
      setError('Mapbox token not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search for bodies of water, lakes, reservoirs
      // types: poi (point of interest - includes lakes, reservoirs)
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        types: 'poi,place', // poi includes lakes/reservoirs, place includes cities (for backup)
        limit: '8',
        country: 'US', // Limit to US for better results
        language: 'en',
      });

      const url = `${MAPBOX_API}/${encodeURIComponent(query)}.json?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data: MapboxResponse = await response.json();

      // Filter to prioritize bodies of water
      const filtered = data.features.filter((f) => {
        const name = f.text.toLowerCase();
        const fullName = f.place_name.toLowerCase();
        
        // Prioritize actual bodies of water
        return (
          fullName.includes('lake') ||
          fullName.includes('reservoir') ||
          fullName.includes('river') ||
          name.includes('lake') ||
          name.includes('reservoir') ||
          f.place_type.includes('poi')
        );
      });

      setResults(filtered.length > 0 ? filtered : data.features.slice(0, 5));
    } catch (err) {
      console.error('Mapbox search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
