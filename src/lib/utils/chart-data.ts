interface Movie {
  title: string;
  release_date: string;
  vote_average: number;
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  tension: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export function formatMovieTimeline(movies: Movie[]): ChartData {
  // Sort movies by release date
  const sortedMovies = sortByReleaseDate(movies);

  // Extract labels (movie titles with years)
  const labels = sortedMovies.map((movie) => {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown';
    return `${movie.title} (${year})`;
  });

  // Extract ratings
  const ratings = extractRatings(sortedMovies);

  // Create dataset
  const datasets: ChartDataset[] = [
    {
      label: 'TMDB Rating',
      data: ratings,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    },
  ];

  return {
    labels,
    datasets,
  };
}

export function sortByReleaseDate(movies: Movie[]): Movie[] {
  return [...movies].sort((a, b) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return dateA - dateB;
  });
}

export function extractRatings(movies: Movie[]): number[] {
  return movies.map((movie) => movie.vote_average || 0);
}

export function getTopMovies(movies: Movie[], limit: number = 3): Array<{
  title: string;
  rating: number;
  year: string;
}> {
  const sorted = [...movies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

  return sorted.slice(0, limit).map((movie) => ({
    title: movie.title,
    rating: movie.vote_average || 0,
    year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'Unknown',
  }));
}
