import { Routes } from '@angular/router';
import { RegistroComponent } from './components/registro/registro.component';
import { HomeComponent } from './components/home/home.component';
import { IniciarSesionComponent } from './components/iniciar-sesion/iniciar-sesion.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { FormAvistamientosComponent } from './components/form-avistamientos/form-avistamientos.component'; 
import { ForoAvistamientosComponent } from './components/foro-avistamientos/foro-avistamientos.component'; 


export const routes: Routes = [
  { path: '', component: HomeComponent }, 
  { path: 'registro', component: RegistroComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: 'reportes', component: ReportesComponent }, 
  { path: 'perfil', component: PerfilComponent },

  { path: 'foro-avistamientos', component: ForoAvistamientosComponent }, 
  { path: 'avistamientos/form', component: FormAvistamientosComponent }, 
  { path: 'avistamientos/form/:id', component: FormAvistamientosComponent }, 
 


  { path: '**', redirectTo: '' } 
];

