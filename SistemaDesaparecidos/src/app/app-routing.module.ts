import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroComponent } from './components/registro/registro.component';
import { ForoAvistamientosComponent } from './components/foro-avistamientos/foro-avistamientos.component';

const routes: Routes = [
  { path: 'registro', component: RegistroComponent },
  { path: 'foro-avistamientos/:id', component: ForoAvistamientosComponent }, 
  { path: '', redirectTo: '/registro', pathMatch: 'full' }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], 
  exports: [RouterModule],
})
export class AppRoutingModule {}
