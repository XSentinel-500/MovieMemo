export function createLocationPrompt(movieTitle: string, movieData: any): string {
  return `You are a film location expert. Identify ALL major filming locations for this movie.

Movie: ${movieTitle}
Release Year: ${movieData.release_date || 'Unknown'}
Director: ${movieData.director || 'Unknown'}
Overview: ${movieData.overview || 'No overview available'}

Task:
Provide a comprehensive list of filming locations used in this movie (aim for at least 5-10 locations if available).

For each location, provide:
1. Scene name (e.g., "Opening Chase Scene", "Final Battle", "Café Meeting")
2. Real-world location name (specific venue/landmark if applicable)
3. Full address (as specific as possible)
4. City
5. Country
6. Coordinates (latitude, longitude) - use your best knowledge
7. Scene description (what happens in this location)
8. Production notes (interesting facts about filming at this location)

IMPORTANT: Return ONLY a valid JSON array with no additional text. Format:
[
  {
    "sceneName": "Scene Name",
    "locationName": "Specific Location Name",
    "address": "Full Address",
    "city": "City Name",
    "country": "Country Name",
    "coordinates": {
      "lat": 0.0,
      "lng": 0.0
    },
    "sceneDescription": "What happens in this scene",
    "productionNotes": "Interesting filming facts"
  }
]

Be accurate and specific. Only include locations you're confident about.`;
}
