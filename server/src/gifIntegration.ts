/**
 * GIF Integration - Giphy and Tenor API integration for GIF search
 */

import type { GifSearchResult, GifData, GifSource } from './types.js';

// API Keys from environment
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || '';
const TENOR_API_KEY = process.env.TENOR_API_KEY || '';

// Cache for trending GIFs (fallback)
let trendingCache: GifSearchResult[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Search Giphy for GIFs
 */
async function searchGiphy(query: string, limit: number = 20): Promise<GifSearchResult[]> {
  if (!GIPHY_API_KEY) {
    console.warn('GIPHY_API_KEY not set');
    return [];
  }
  
  try {
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg-13`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.map((gif: unknown) => {
      const g = gif as {
        id: string;
        images: {
          original: { url: string; width: string; height: string };
          fixed_width_small: { url: string };
        };
        title: string;
      };
      return {
        id: g.id,
        url: g.images.original.url,
        previewUrl: g.images.fixed_width_small?.url || g.images.original.url,
        title: g.title || 'GIF',
        width: parseInt(g.images.original.width, 10),
        height: parseInt(g.images.original.height, 10),
      };
    });
  } catch (error) {
    console.error('Giphy search failed:', error);
    return [];
  }
}

/**
 * Search Tenor for GIFs
 */
async function searchTenor(query: string, limit: number = 20): Promise<GifSearchResult[]> {
  if (!TENOR_API_KEY) {
    console.warn('TENOR_API_KEY not set');
    return [];
  }
  
  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=${limit}&contentfilter=medium`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.results.map((gif: unknown) => {
      const g = gif as {
        id: string;
        media_formats: {
          gif: { url: string; dims: number[] };
          tinygif: { url: string };
        };
        content_description: string;
      };
      return {
        id: g.id,
        url: g.media_formats.gif.url,
        previewUrl: g.media_formats.tinygif?.url || g.media_formats.gif.url,
        title: g.content_description || 'GIF',
        width: g.media_formats.gif.dims[0],
        height: g.media_formats.gif.dims[1],
      };
    });
  } catch (error) {
    console.error('Tenor search failed:', error);
    return [];
  }
}

/**
 * Get trending GIFs from Giphy
 */
async function getTrendingGiphy(limit: number = 20): Promise<GifSearchResult[]> {
  if (!GIPHY_API_KEY) {
    return getFallbackGifs();
  }
  
  try {
    const url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=pg-13`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.map((gif: unknown) => {
      const g = gif as {
        id: string;
        images: {
          original: { url: string; width: string; height: string };
          fixed_width_small: { url: string };
        };
        title: string;
      };
      return {
        id: g.id,
        url: g.images.original.url,
        previewUrl: g.images.fixed_width_small?.url || g.images.original.url,
        title: g.title || 'GIF',
        width: parseInt(g.images.original.width, 10),
        height: parseInt(g.images.original.height, 10),
      };
    });
  } catch (error) {
    console.error('Giphy trending failed:', error);
    return getFallbackGifs();
  }
}

/**
 * Get trending GIFs from Tenor
 */
async function getTrendingTenor(limit: number = 20): Promise<GifSearchResult[]> {
  if (!TENOR_API_KEY) {
    return [];
  }
  
  try {
    const url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=${limit}&contentfilter=medium`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.results.map((gif: unknown) => {
      const g = gif as {
        id: string;
        media_formats: {
          gif: { url: string; dims: number[] };
          tinygif: { url: string };
        };
        content_description: string;
      };
      return {
        id: g.id,
        url: g.media_formats.gif.url,
        previewUrl: g.media_formats.tinygif?.url || g.media_formats.gif.url,
        title: g.content_description || 'GIF',
        width: g.media_formats.gif.dims[0],
        height: g.media_formats.gif.dims[1],
      };
    });
  } catch (error) {
    console.error('Tenor trending failed:', error);
    return [];
  }
}

/**
 * Fallback GIFs when APIs fail
 */
function getFallbackGifs(): GifSearchResult[] {
  return [
    {
      id: 'fallback_1',
      url: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/200w_s.gif',
      title: 'Excited',
      width: 480,
      height: 270,
    },
    {
      id: 'fallback_2',
      url: 'https://media.giphy.com/media/3o7abldj0b3rxrZUxW/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/3o7abldj0b3rxrZUxW/200w_s.gif',
      title: 'Reaction',
      width: 480,
      height: 270,
    },
    {
      id: 'fallback_3',
      url: 'https://media.giphy.com/media/l41lUjUgLLwWrz0Xu/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/l41lUjUgLLwWrz0Xu/200w_s.gif',
      title: 'Funny',
      width: 480,
      height: 270,
    },
  ];
}

/**
 * Search for GIFs across providers
 */
export async function searchGifs(query: string, limit: number = 20): Promise<GifSearchResult[]> {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return getTrendingGifs(limit);
  }
  
  // Search both providers in parallel
  const [giphyResults, tenorResults] = await Promise.all([
    searchGiphy(trimmedQuery, Math.ceil(limit / 2)),
    searchTenor(trimmedQuery, Math.floor(limit / 2)),
  ]);
  
  // Combine and shuffle results
  const combined = [...giphyResults, ...tenorResults];
  
  // If no results, return trending
  if (combined.length === 0) {
    return getTrendingGifs(limit);
  }
  
  // Shuffle array
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  
  return combined.slice(0, limit);
}

/**
 * Get trending GIFs
 */
export async function getTrendingGifs(limit: number = 20): Promise<GifSearchResult[]> {
  const now = Date.now();
  
  // Return cached results if fresh
  if (trendingCache.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return trendingCache.slice(0, limit);
  }
  
  // Fetch fresh trending GIFs
  const [giphyTrending, tenorTrending] = await Promise.all([
    getTrendingGiphy(Math.ceil(limit / 2)),
    getTrendingTenor(Math.floor(limit / 2)),
  ]);
  
  const combined = [...giphyTrending, ...tenorTrending];
  
  // Update cache
  trendingCache = combined.length > 0 ? combined : getFallbackGifs();
  cacheTimestamp = now;
  
  return trendingCache.slice(0, limit);
}

/**
 * Get GIF suggestions based on sound (random funny GIFs)
 */
export async function getSoundReactionGifs(): Promise<GifSearchResult[]> {
  const reactions = ['reaction', 'funny', 'shocked', 'confused', 'excited', 'laughing'];
  const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
  return searchGifs(randomReaction, 10);
}

/**
 * Convert search result to GifData
 */
export function toGifData(searchResult: GifSearchResult, source: GifSource): GifData {
  return {
    id: searchResult.id,
    url: searchResult.url,
    previewUrl: searchResult.previewUrl,
    source,
    title: searchResult.title,
    width: searchResult.width,
    height: searchResult.height,
  };
}

/**
 * Check if GIF APIs are configured
 */
export function isGifApiConfigured(): boolean {
  return !!(GIPHY_API_KEY || TENOR_API_KEY);
}
