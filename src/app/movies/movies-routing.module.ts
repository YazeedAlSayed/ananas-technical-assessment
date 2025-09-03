import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MoviesListComponent } from './movies-list.component';
import { MovieDetailComponent } from './movie-detail.component';
import { movieDetailResolver } from './movie-detail.resolver';

const routes: Routes = [
  { path: '', component: MoviesListComponent },
  { path: ':id', component: MovieDetailComponent, resolve: { movie: movieDetailResolver } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MoviesRoutingModule {}
