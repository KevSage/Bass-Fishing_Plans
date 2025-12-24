// src/hooks/useMapboxSearch.ts
import { useState, useCallback } from 'react';
import LAKES_DATA from '../data/lakes.json';

export type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  place_type: string[];
  properties: {
    mapbox_id?: string;
    tier?: number;
    acres?: number;
  };
};

type Lake = {
  name: string;
  state: string;
  city?: string;
  latitude: number;
  longitude: number;
  acres?: number;
  tier: number;
};

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const LAKES: Lake[] = LAKES_DATA as Lake[];

/**
 * Simple fuzzy match - checks if all query words appear in target
 */
function fuzzyMatch(query: string, target: string): boolean {
  const queryWords = query.toLowerCase().split(/\s+/);
  const targetLower = target.toLowerCase();
  
  return queryWords.every(word => targetLower.includes(word));
}

/**
 * Search local lakes database
 */
function searchLakesDatabase(query: string): MapboxFeature[] {
  const results: Array<Lake & { score: number }> = [];
  
  for (const lake of LAKES) {
    const searchText = `${lake.name} ${lake.city || ''} ${lake.state}`;
    
    if (fuzzyMatch(query, searchText)) {
      // Calculate relevance score
      let score = 0;
      
      // Exact name match gets highest score
      if (lake.name.toLowerCase() === query.toLowerCase()) {
        score += 1000;
      }
      // Name starts with query
      else if (lake.name.toLowerCase().startsWith(query.toLowerCase())) {
        score += 500;
      }
      // Name contains query
      else if (lake.name.toLowerCase().includes(query.toLowerCase())) {
        score += 100;
      }
      
      // Tier bonus (tier 1 = major lakes)
      score += (4 - lake.tier) * 50;
      
      // Size bonus (larger = more important)
      if (lake.acres) {
        score += Math.min(lake.acres / 1000, 50);
      }
      
      results.push({ ...lake, score });
    }
  }
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  // Convert to MapboxFeature format
  return results.slice(0, 6).map((lake, i) => ({
    id: `lake-${i}`,
    place_name: `${lake.name}, ${lake.city ? lake.city + ', ' : ''}${lake.state}`,
    text: lake.name,
    center: [lake.longitude, lake.latitude],
    place_type: ['poi'],
    properties: {
      tier: lake.tier,
      acres: lake.acres,
    },
  }));
}

export function useMapboxSearch() {
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search local lakes database first
      const lakeResults = searchLakesDatabase(query);
      
      // Also search Mapbox for cities/places (for navigation)
      let placeResults: MapboxFeature[] = [];
      
      if (MAPBOX_ACCESS_TOKEN) {
        const params = new URLSearchParams({
          access_token: MAPBOX_ACCESS_TOKEN,
          types: 'place',
          limit: '3',
          country: 'US',
          language: 'en',
        });

        const url = `${MAPBOX_API}/${encodeURIComponent(query)}.json?${params}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          placeResults = data.features || [];
        }
      }
      
      // Combine: lakes first (up to 6), then cities (up to 2)
      const combined = [
        ...lakeResults,
        ...placeResults.slice(0, 2),
      ].slice(0, 8);
      
      setResults(combined);
    } catch (err) {
      console.error('Search error:', err);
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
