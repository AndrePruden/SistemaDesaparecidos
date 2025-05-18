import { Routes } from '@angular/router';
import { RegistroComponent } from './components/registro/registro.component';
import { HomeComponent } from './components/home/home.component';
import { IniciarSesionComponent } from './components/iniciar-sesion/iniciar-sesion.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { PerfilComponent } from './components/perfil/perfil.component';
// Asegúrate de importar los componentes de avistamientos aquí
import { ForoAvistamientosComponent } from './components/foro-avistamientos/foro-avistamientos.component';
import { FormAvistamientosComponent } from './components/form-avistamientos/form-avistamientos.component';


export const routes: Routes = [
  { path: '', component: HomeComponent }, // Página principal (Home)
  { path: 'registro', component: RegistroComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: 'reportes', component: ReportesComponent},
  { path: 'perfil', component: PerfilComponent},
  { path: 'foro-avistamientos/:id', component: ForoAvistamientosComponent }, // Si esta ruta es para ver por Reporte ID
  { path: 'avistamientos', component: ForoAvistamientosComponent }, // Ruta para ver TODOS los avistamientos
  { path: 'avistamientos/form', component: FormAvistamientosComponent }, // Ruta para CREAR un avistamiento
  { path: 'avistamientos/form/:id', component: FormAvistamientosComponent }, // Ruta para EDITAR un avistamiento (con ID)
  // ------------------------------------------------------------------------

  { path: '**', redirectTo: '' } 
];