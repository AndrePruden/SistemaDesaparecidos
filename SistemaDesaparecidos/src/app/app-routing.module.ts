import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroComponent } from './components/registro/registro.component';
import { ForoAvistamientosComponent } from './components/foro-avistamientos/foro-avistamientos.component';

const routes: Routes = [
  { path: 'registro', component: RegistroComponent },
  { path: 'foro-avistamientos/:id', component: ForoAvistamientosComponent }, // Parametro id
  { path: '', redirectTo: '/registro', pathMatch: 'full' }, // Ruta por defecto
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Asegúrate de que el RouterModule esté configurado
  exports: [RouterModule],
})
export class AppRoutingModule {}
