import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Puedes dejarlo con un array de rutas vacío o con solo el RouterModule
const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}