// src/components/WaterBodyMap.tsx
// Interactive map with soft-lock to bodies of water

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

type WaterBody = {
  name: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
};

type WaterBodyMapProps = {
  onSelect: (waterBody: WaterBody) => void;
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
};

export function WaterBodyMap({ 
  onSelect,
  initialCenter = [-86.7816, 33.5186], // Alabama (center of US bass fishing)
  initialZoom = 6
}: WaterBodyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [softLockedWater, setSoftLockedWater] = useState<WaterBody | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.error('VITE_MAPBOX_TOKEN not found in environment');
      return;
    }

    if (map.current) return; // Initialize map only once

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/outdoors-v12', // Outdoors style shows water bodies well
      center: initialCenter,
      zoom: initialZoom,
    });

    // Add navigation controls (zoom, rotate)
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control (find user's location)
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right'
    );

    // Wait for map to load, then add interactivity
    map.current.on('load', () => {
      if (!map.current) return;

      // Listen for clicks on the map
      map.current.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        
        // Query what's at this location
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['water', 'waterway'] // Mapbox outdoor style water layers
        });

        if (features.length > 0) {
          // User clicked on water - try to get the name
          await handleWaterClick(lng, lat);
        } else {
          // User clicked on land - still allow selection but show coordinates
          handleLandClick(lng, lat);
        }
      });

      // Soft-lock on hover/move
      map.current.on('mousemove', async (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['water', 'waterway']
        });

        if (features.length > 0) {
          // Over water - trigger soft-lock
          const { lng, lat } = e.lngLat;
          await updateSoftLock(lng, lat);
          map.current!.getCanvas().style.cursor = 'pointer';
        } else {
          // Not over water
          setSoftLockedWater(null);
          map.current!.getCanvas().style.cursor = '';
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const updateSoftLock = async (lng: number, lat: number) => {
    try {
      // Reverse geocode to get water body name
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        // Extract city and state from context
        const city = context.find((c: any) => c.id.startsWith('place'))?.text;
        const state = context.find((c: any) => c.id.startsWith('region'))?.short_code?.replace('US-', '');

        setSoftLockedWater({
          name: feature.text || 'Water Body',
          city,
          state,
          latitude: lat,
          longitude: lng,
        });

        // Show temporary marker
        if (markerRef.current) {
          markerRef.current.remove();
        }
        
        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid #4A90E2';
        el.style.backgroundColor = 'rgba(74, 144, 226, 0.3)';
        
        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
    }
  };

  const handleWaterClick = async (lng: number, lat: number) => {
    try {
      // Get detailed info about this water body
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi,place&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        const city = context.find((c: any) => c.id.startsWith('place'))?.text;
        const state = context.find((c: any) => c.id.startsWith('region'))?.short_code?.replace('US-', '');

        const waterBody: WaterBody = {
          name: feature.text || 'Selected Water Body',
          city,
          state,
          latitude: lat,
          longitude: lng,
        };

        onSelect(waterBody);
        
        // Add permanent marker
        if (markerRef.current) {
          markerRef.current.remove();
        }
        
        const el = document.createElement('div');
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '4px solid #4A90E2';
        el.style.backgroundColor = '#4A90E2';
        
        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    } catch (error) {
      console.error('Failed to get water body details:', error);
    }
  };

  const handleLandClick = (lng: number, lat: number) => {
    // User clicked on land - still allow it but use coordinates
    const waterBody: WaterBody = {
      name: 'Custom Location',
      latitude: lat,
      longitude: lng,
    };
    
    onSelect(waterBody);
    
    if (markerRef.current) {
      markerRef.current.remove();
    }
    
    markerRef.current = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map.current!);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '400px',
          borderRadius: '12px',
          overflow: 'hidden'
        }} 
      />
      
      {/* Soft-lock indicator */}
      {softLockedWater && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid rgba(74, 144, 226, 0.5)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '1em', fontWeight: 600, color: '#4A90E2' }}>
            {softLockedWater.name}
          </div>
          {(softLockedWater.city || softLockedWater.state) && (
            <div style={{ fontSize: '0.85em', opacity: 0.7, marginTop: 2 }}>
              {[softLockedWater.city, softLockedWater.state].filter(Boolean).join(', ')}
            </div>
          )}
          <div style={{ fontSize: '0.75em', opacity: 0.5, marginTop: 4 }}>
            Click to select
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: '0.85em',
          textAlign: 'center',
          opacity: 0.8,
        }}
      >
        Pan and zoom to find your water. Tap to select.
      </div>
    </div>
  );
}
