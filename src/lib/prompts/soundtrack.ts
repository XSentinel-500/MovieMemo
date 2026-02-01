export function createSoundtrackPrompt(movieTitle: string, movieData: any): string {
  return `You are a movie soundtrack expert. Based on the following movie information, provide a comprehensive soundtrack list.

Movie: ${movieTitle}
Release Year: ${movieData.release_date || 'Unknown'}
Genre: ${movieData.genres?.map((g: any) => g.name).join(', ') || 'Unknown'}
Overview: ${movieData.overview || 'No overview available'}

Task:
1. List ALL songs featured in this movie (aim for at least 8-15 songs if available)
2. For each song, provide:
   - Song title (exact name)
   - Artist/Composer name
   - Scene description (when/where it appears in the movie)
   - Approximate timestamp (format: "MM:SS" or "HH:MM:SS", use "Unknown" if not certain)
   - Whether it's an iconic/memorable track (true/false)

IMPORTANT: Return ONLY a valid JSON array with no additional text. Format:
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "sceneDescription": "Description of when this song appears",
    "timestamp": "MM:SS or Unknown",
    "isIconic": true
  }
]

Be accurate and specific. Only include songs you're confident about.`;
}
