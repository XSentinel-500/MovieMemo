export function createEasterEggPrompt(movieTitle: string, movieData: any): string {
  return `You are a movie trivia expert specializing in easter eggs and hidden references.

Movie: ${movieTitle}
Director: ${movieData.director || 'Unknown'}
Release Year: ${movieData.release_date || 'Unknown'}
Genre: ${movieData.genres?.map((g: any) => g.name).join(', ') || 'Unknown'}
Overview: ${movieData.overview || 'No overview available'}

Task:
Identify ALL easter eggs, hidden references, cameos, and subtle details in this movie (aim for at least 8-15 easter eggs).

For each easter egg, provide:
1. Description of the easter egg (what it is)
2. What it references (other movies, real events, inside jokes, director's previous work, etc.)
3. Scene location (approximate timestamp in "MM:SS" or "HH:MM:SS" format, or scene description)
4. Significance or context (why this easter egg matters)

IMPORTANT: Return ONLY a valid JSON array with no additional text. Format:
[
  {
    "description": "Description of the easter egg",
    "reference": "What it references",
    "sceneLocation": "Timestamp or scene description",
    "significance": "Why this matters or context"
  }
]

Include various types of easter eggs:
- Visual references and hidden details
- Dialogue callbacks and quotes
- Cameo appearances
- Props and set design references
- Director's signature elements
- Connections to other films
- Real-world references

Be accurate and specific. Only include easter eggs you're confident about.`;
}
