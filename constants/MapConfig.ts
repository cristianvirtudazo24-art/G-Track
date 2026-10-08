// Mapbox Configuration for G!Track Mobile
// Supports official Mapbox access token or fallback Mapbox-styled HD raster tiles

export const OPENSTREETMAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export const MAPBOX_TILE_URL = MAPBOX_ACCESS_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`
  : OPENSTREETMAP_TILE_URL;

export const MAPBOX_DARK_TILE_URL = MAPBOX_ACCESS_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`
  : OPENSTREETMAP_TILE_URL;

export const MAP_CONFIG = {
  tileUrl: OPENSTREETMAP_TILE_URL,
  darkTileUrl: OPENSTREETMAP_TILE_URL,
  tileSize: 256,
  maximumZ: 19,
  minimumZ: 0,
  flipY: false,
};
