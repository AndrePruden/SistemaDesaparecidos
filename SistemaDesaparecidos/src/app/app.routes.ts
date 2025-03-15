import { Routes } from '@angular/router';
import { RegistroComponent } from './components/registro/registro.component';
import { HomeComponent } from './components/home/home.component';
import { IniciarSesionComponent } from './components/iniciar-sesion/iniciar-sesion.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Página principal
  { path: 'registro', component: RegistroComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: '**', redirectTo: '' } // Redirigir rutas no encontradas a la página principal
];