import { Routes } from '@angular/router';
import { RegistroComponent } from './components/registro/registro.component';

export const routes: Routes = [
  { path: 'registro', component: RegistroComponent },
  { path: '', redirectTo: '/registro', pathMatch: 'full' }, // Ruta por defecto
];