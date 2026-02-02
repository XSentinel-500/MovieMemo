import { z } from "zod";
import { createAgentApp } from "@lucid-agents/hono";
import { createAgent } from "@lucid-agents/core";
import { createAxLLMClient } from "@lucid-agents/core/axllm";
import { payments, paymentsFromEnv } from "@lucid-agents/payments";
import { http } from "@lucid-agents/http";

// Import API clients
import { tmdbClient } from "./apis/tmdb.js";
import { youtubeMusicClient } from "./apis/youtube-music.js";
import { googleMapsClient } from "./apis/google-maps.js";

// Import utilities
import { formatMovieTimeline, getTopMovies } from "./utils/chart-data.js";

// MiniMax API helper
async function callMiniMax(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = process.env.OPENAI_API_URL || 'https://api.minimaxi.com/v1';
  const model = process.env.OPENAI_MODEL || 'MiniMax-M2.1';
  
  if (!apiKey) {
    console.warn('[agent] MiniMax API key not configured');
    return '[]';
  }
  
  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 2048,
      }),
    });
    
    if (!response.ok) {
      console.error(`[agent] MiniMax API error: ${response.status}`);
      return '[]';
    }
    
    const data = await response.json();
    
    // Handle OpenAI/MiniMax format: choices[0].message.content
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message?.content || '[]';
    }
    
    return '[]';
  } catch (error) {
    console.error('[agent] MiniMax API call failed:', error);
    return '[]';
  }
}

// Robust JSON parser for LLM responses
function parseJsonArray(content: string, label: string): any[] {
  if (!content || typeof content !== 'string') return [];
  
  let cleanContent = content.trim();
  
  // Remove <think>...</think> tags (MiniMax reasoning output)
  cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  
  // Remove markdown code block markers
  cleanContent = cleanContent.replace(/```\s*json?\s*/gi, '').replace(/```/g, '').trim();
  
  // Remove leading/trailing whitespace
  cleanContent = cleanContent.trim();
  
  // Find the first '[' and last ']' to extract the array
  const firstArray = cleanContent.indexOf('[');
  const lastArray = cleanContent.lastIndexOf(']');
  
  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    cleanContent = cleanContent.slice(firstArray, lastArray + 1).trim();
  }
  
  try {
    const parsed = JSON.parse(cleanContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Try to fix common issues
    try {
      const fixed = cleanContent
        .replace(/'/g, '"')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      const parsed = JSON.parse(fixed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (fixError) {
      // Try extracting individual objects
      try {
        const objectMatches = cleanContent.match(/\{[^}]+\}/g);
        if (objectMatches) {
          const objects = objectMatches.map(obj => {
            try {
              return JSON.parse(obj.replace(/'/g, '"'));
            } catch {
              return null;
            }
          }).filter(Boolean);
          if (objects.length > 0) {
            console.log(`[agent] ${label}: extracted ${objects.length} objects from malformed JSON`);
            return objects;
          }
        }
      } catch (extractError) {
        // Ignore extraction errors
      }
    }

    console.error(`[agent] Failed to parse ${label} JSON`);
    console.error(`[agent] ${label} preview:`, cleanContent.slice(0, 300));
    return [];
  }
}

// Import prompts
import { createSoundtrackPrompt } from "./prompts/soundtrack.js";
import { createLocationPrompt } from "./prompts/location.js";
import { createEasterEggPrompt } from "./prompts/easter-eggs.js";

// Debug: Log payments config
const paymentsConfig = paymentsFromEnv();
console.log('[DEBUG] paymentsConfig:', JSON.stringify(paymentsConfig, null, 2));

// Create agent with payment support
const agent = await createAgent({
  name: process.env.AGENT_NAME ?? "MovieMemo",
  version: process.env.AGENT_VERSION ?? "0.1.0",
  description: process.env.AGENT_DESCRIPTION ?? "Two-tier movie information agent with free and paid endpoints",
})
  .use(http())
  .use(payments({ config: paymentsConfig }))
  .build();

// Create LLM client
const axClient = createAxLLMClient({
  logger: {
    warn(message, error) {
      if (error) {
        console.warn(`[agent] ${message}`, error);
      } else {
        console.warn(`[agent] ${message}`);
      }
    },
  },
});

if (!axClient.isConfigured()) {
  console.warn(
    "[agent] Ax LLM provider not configured — falling back to scripted output."
  );
}

const { app, addEntrypoint } = await createAgentApp(agent);

// ============================================================================
// FREE ENDPOINT 1: movie-info
// ============================================================================

const movieInfoInputSchema = z.object({
  movieTitle: z.string().min(1).describe('Movie title to search for'),
});

const movieInfoOutputSchema = z.object({
  title: z.string(),
  director: z.string(),
  cast: z.array(z.string()),
  ratings: z.object({
    tmdb: z.number().optional(),
  }),
  boxOffice: z.object({
    budget: z.number().optional(),
    worldwide: z.number().optional(),
  }),
  releaseDate: z.string(),
  poster: z.string().optional(),
  overview: z.string().optional(),
});

addEntrypoint({
  key: "movie-info",
  description: "Get basic movie information including director, cast, ratings, and box office data",
  input: movieInfoInputSchema,
  output: movieInfoOutputSchema,
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof movieInfoInputSchema>;

    try {
      // Search for movie
      const movie = await tmdbClient.searchMovie(input.movieTitle);
      if (!movie) {
        throw new Error(`Movie "${input.movieTitle}" not found`);
      }

      // Get detailed movie info
      const details = await tmdbClient.getMovieDetails(movie.id);
      const credits = await tmdbClient.getMovieCredits(movie.id);

      // Extract director
      const director = credits.crew.find(c => c.job === 'Director')?.name || 'Unknown';

      // Extract top cast (first 10)
      const cast = credits.cast
        .sort((a, b) => a.order - b.order)
        .slice(0, 10)
        .map(c => c.name);

      return {
        output: {
          title: details.title,
          director,
          cast,
          ratings: {
            tmdb: details.vote_average,
          },
          boxOffice: {
            budget: details.budget > 0 ? details.budget : undefined,
            worldwide: details.revenue > 0 ? details.revenue : undefined,
          },
          releaseDate: details.release_date,
          poster: tmdbClient.getPosterUrl(details.poster_path) || undefined,
          overview: details.overview || undefined,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch movie info: ${error.message}`);
    }
  },
});

// ============================================================================
// FREE ENDPOINT 2: actor-director-trends
// ============================================================================

const trendsInputSchema = z.object({
  personName: z.string().min(1).describe('Actor or director name'),
  limit: z.number().min(1).max(20).default(10).describe('Number of movies to include'),
});

const trendsOutputSchema = z.object({
  personName: z.string(),
  chartData: z.object({
    labels: z.array(z.string()),
    datasets: z.array(z.object({
      label: z.string(),
      data: z.array(z.number()),
      borderColor: z.string(),
      tension: z.number(),
    })),
  }),
  topMovies: z.array(z.object({
    title: z.string(),
    rating: z.number(),
    year: z.string(),
  })),
});

addEntrypoint({
  key: "actor-director-trends",
  description: "Get career trends and ratings timeline for an actor or director",
  input: trendsInputSchema,
  output: trendsOutputSchema,
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof trendsInputSchema>;

    try {
      // Search for person
      const person = await tmdbClient.searchPerson(input.personName);
      if (!person) {
        throw new Error(`Person "${input.personName}" not found`);
      }

      // Get their movies
      const credits = await tmdbClient.getPersonMovies(person.id);

      // Combine cast and crew movies
      const allMovies = [
        ...(credits.cast || []),
        ...(credits.crew || []).filter(m => m.job === 'Director'),
      ];

      // Remove duplicates and filter out movies without ratings
      const uniqueMovies = Array.from(
        new Map(allMovies.map(m => [m.id, m])).values()
      ).filter(m => m.vote_average > 0 && m.release_date);

      // Sort by release date and limit
      const sortedMovies = uniqueMovies
        .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())
        .slice(0, input.limit);

      // Format chart data
      const chartData = formatMovieTimeline(sortedMovies);

      // Get top movies
      const topMovies = getTopMovies(sortedMovies, 3);

      return {
        output: {
          personName: person.name,
          chartData,
          topMovies,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch trends: ${error.message}`);
    }
  },
});

// ============================================================================
// PAID ENDPOINT 1: soundtrack-list (0.01 USDC)
// ============================================================================

const soundtrackInputSchema = z.object({
  movieTitle: z.string().min(1).describe('Movie title'),
});

const soundtrackOutputSchema = z.object({
  movieTitle: z.string(),
  totalSongs: z.number(),
  soundtrack: z.array(z.object({
    title: z.string(),
    artist: z.string(),
    sceneDescription: z.string(),
    timestamp: z.string().optional(),
    isIconic: z.boolean(),
    youtubeMusicLink: z.string().optional(),
  })),
});

addEntrypoint({
  key: "soundtrack-list",
  description: "Get complete soundtrack list with YouTube Music links and scene timestamps",
  input: soundtrackInputSchema,
  output: soundtrackOutputSchema,
  price: "0.01", // 0.01 USDC
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof soundtrackInputSchema>;

    try {
      // Search for movie
      const movie = await tmdbClient.searchMovie(input.movieTitle);
      if (!movie) {
        throw new Error(`Movie "${input.movieTitle}" not found`);
      }

      // Get movie details
      const details = await tmdbClient.getMovieDetails(movie.id);
      const credits = await tmdbClient.getMovieCredits(movie.id);
      const director = credits.crew.find(c => c.job === 'Director')?.name || 'Unknown';

      // Use LLM to identify soundtrack
      const prompt = createSoundtrackPrompt(details.title, {
        ...details,
        director,
      });

      let soundtrackData: any[] = [];

      try {
        const content = await callMiniMax(prompt);
        soundtrackData = parseJsonArray(content, 'soundtrack');
      } catch (e) {
        console.error('Failed to parse LLM response:', e);
        soundtrackData = [];
      }

      // Enrich with YouTube Music links (no API key needed!)
      const enrichedSoundtrack = soundtrackData.map((song: any) => {
        const track = youtubeMusicClient.generateSearchLink(song.title, song.artist);
        return {
          title: song.title,
          artist: song.artist,
          sceneDescription: song.sceneDescription || 'Unknown',
          timestamp: song.timestamp || undefined,
          isIconic: song.isIconic || false,
          youtubeMusicLink: track,
        };
      });

      return {
        output: {
          movieTitle: details.title,
          totalSongs: enrichedSoundtrack.length,
          soundtrack: enrichedSoundtrack,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch soundtrack: ${error.message}`);
    }
  },
});

// ============================================================================
// PAID ENDPOINT 2: filming-location (0.01 USDC)
// ============================================================================

const locationInputSchema = z.object({
  movieTitle: z.string().min(1).describe('Movie title'),
});

const locationOutputSchema = z.object({
  movieTitle: z.string(),
  totalLocations: z.number(),
  locations: z.array(z.object({
    sceneName: z.string(),
    locationName: z.string(),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    googleMapsLink: z.string(),
    sceneDescription: z.string(),
    productionNotes: z.string().optional(),
  })),
});

addEntrypoint({
  key: "filming-location",
  description: "Identify all major filming locations with Google Maps links",
  input: locationInputSchema,
  output: locationOutputSchema,
  price: "0.01", // 0.01 USDC
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof locationInputSchema>;

    try {
      // Search for movie
      const movie = await tmdbClient.searchMovie(input.movieTitle);
      if (!movie) {
        throw new Error(`Movie "${input.movieTitle}" not found`);
      }

      // Get movie details
      const details = await tmdbClient.getMovieDetails(movie.id);
      const credits = await tmdbClient.getMovieCredits(movie.id);
      const director = credits.crew.find(c => c.job === 'Director')?.name || 'Unknown';

      // Use LLM to identify locations
      const prompt = createLocationPrompt(details.title, {
        ...details,
        director,
      });

      let locationData: any[] = [];

      try {
        const content = await callMiniMax(prompt);
        locationData = parseJsonArray(content, 'locations');
      } catch (e) {
        console.error('Failed to parse LLM response:', e);
        locationData = [];
      }

      // Enrich with Google Maps data
      const enrichedLocations = await Promise.all(
        locationData.map(async (loc: any) => {
          try {
            // Try to geocode the location
            const query = `${loc.locationName}, ${loc.city}, ${loc.country}`;
            const geocoded = await googleMapsClient.geocodeLocation(query);

            if (geocoded) {
              const { city, country } = googleMapsClient.extractCityCountry(geocoded);
              return {
                sceneName: loc.sceneName,
                locationName: loc.locationName,
                address: geocoded.formatted_address,
                city: city || loc.city,
                country: country || loc.country,
                coordinates: {
                  lat: geocoded.geometry.location.lat,
                  lng: geocoded.geometry.location.lng,
                },
                googleMapsLink: googleMapsClient.generateMapsLink(
                  geocoded.geometry.location.lat,
                  geocoded.geometry.location.lng,
                  loc.locationName
                ),
                sceneDescription: loc.sceneDescription,
                productionNotes: loc.productionNotes || undefined,
              };
            }

            // Fallback to LLM-provided coordinates
            return {
              sceneName: loc.sceneName,
              locationName: loc.locationName,
              address: loc.address,
              city: loc.city,
              country: loc.country,
              coordinates: loc.coordinates,
              googleMapsLink: googleMapsClient.generateMapsLink(
                loc.coordinates.lat,
                loc.coordinates.lng,
                loc.locationName
              ),
              sceneDescription: loc.sceneDescription,
              productionNotes: loc.productionNotes || undefined,
            };
          } catch (e) {
            console.error('Failed to geocode location:', e);
            return {
              sceneName: loc.sceneName,
              locationName: loc.locationName,
              address: loc.address,
              city: loc.city,
              country: loc.country,
              coordinates: loc.coordinates,
              googleMapsLink: googleMapsClient.generateMapsLink(
                loc.coordinates.lat,
                loc.coordinates.lng,
                loc.locationName
              ),
              sceneDescription: loc.sceneDescription,
              productionNotes: loc.productionNotes || undefined,
            };
          }
        })
      );

      return {
        output: {
          movieTitle: details.title,
          totalLocations: enrichedLocations.length,
          locations: enrichedLocations,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch filming locations: ${error.message}`);
    }
  },
});

// ============================================================================
// PAID ENDPOINT 3: easter-egg-guide (0.01 USDC)
// ============================================================================

const easterEggInputSchema = z.object({
  movieTitle: z.string().min(1).describe('Movie title'),
});

const easterEggOutputSchema = z.object({
  movieTitle: z.string(),
  totalEasterEggs: z.number(),
  easterEggs: z.array(z.object({
    description: z.string(),
    reference: z.string(),
    sceneLocation: z.string(),
    timestamp: z.string().optional(),
    significance: z.string(),
  })),
});

addEntrypoint({
  key: "easter-egg-guide",
  description: "Discover hidden easter eggs, references, and cameos in the movie",
  input: easterEggInputSchema,
  output: easterEggOutputSchema,
  price: "0.01", // 0.01 USDC
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof easterEggInputSchema>;

    try {
      // Search for movie
      const movie = await tmdbClient.searchMovie(input.movieTitle);
      if (!movie) {
        throw new Error(`Movie "${input.movieTitle}" not found`);
      }

      // Get movie details
      const details = await tmdbClient.getMovieDetails(movie.id);
      const credits = await tmdbClient.getMovieCredits(movie.id);
      const director = credits.crew.find(c => c.job === 'Director')?.name || 'Unknown';

      // Use LLM to identify easter eggs
      const prompt = createEasterEggPrompt(details.title, {
        ...details,
        director,
      });

      let easterEggData: any[] = [];

      try {
        const content = await callMiniMax(prompt);
        easterEggData = parseJsonArray(content, 'easter-eggs');
      } catch (e) {
        console.error('Failed to parse LLM response:', e);
        easterEggData = [];
      }

      return {
        output: {
          movieTitle: details.title,
          totalEasterEggs: easterEggData.length,
          easterEggs: easterEggData.map((egg: any) => ({
            description: egg.description,
            reference: egg.reference,
            sceneLocation: egg.sceneLocation,
            timestamp: egg.timestamp || undefined,
            significance: egg.significance,
          })),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch easter eggs: ${error.message}`);
    }
  },
});

export { app };
