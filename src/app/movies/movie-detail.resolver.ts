import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TmdbService } from './tmdb.service';
import { MovieDetails } from '../shared/models';

export const movieDetailResolver: ResolveFn<MovieDetails> = (route) => {
  const id = Number(route.paramMap.get('id'));
  const tmdb = inject(TmdbService);
  return tmdb.details(id);
};
