export interface UserCredential {
  username: string;
  password: string;
}

export interface MovieListItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  overview?: string;
  original_title?: string;
  original_language?: string;
  genre_ids?: number[];
  vote_average?: number; // TMDB rating 0-10
}

export interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  genres?: { id: number; name: string }[];
  runtime?: number;
  vote_average?: number; // TMDB rating 0-10
}
