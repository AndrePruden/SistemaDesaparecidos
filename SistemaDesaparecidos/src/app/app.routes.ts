import { Routes } from '@angular/router';
import { RegistroComponent } from './components/registro/registro.component';
import { HomeComponent } from './components/home/home.component';
import { IniciarSesionComponent } from './components/iniciar-sesion/iniciar-sesion.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { PerfilComponent } from './components/perfil/perfil.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Página principal
  { path: 'registro', component: RegistroComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: 'reportes', component: ReportesComponent},
  { path: 'perfil', component: PerfilComponent},
  { path: '**', redirectTo: '' } // Redirigir rutas no encontradas a la página principal
];