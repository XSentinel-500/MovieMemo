/**
 * YouTube Music link generator
 * No API key required - generates search links directly
 */

interface YouTubeMusicTrack {
  title: string;
  artist: string;
  searchUrl: string;
}

class YouTubeMusicClient {
  /**
   * Generate a YouTube Music search URL for a track
   */
  generateSearchLink(title: string, artist: string): string {
    const query = encodeURIComponent(`${title} ${artist}`);
    return `https://music.youtube.com/search?q=${query}`;
  }

  /**
   * Search for a track and return the search URL
   * This doesn't actually call any API - just generates the link
   */
  async searchTrack(title: string, artist: string): Promise<YouTubeMusicTrack> {
    return {
      title,
      artist,
      searchUrl: this.generateSearchLink(title, artist),
    };
  }
}

export const youtubeMusicClient = new YouTubeMusicClient();
export type { YouTubeMusicTrack };
