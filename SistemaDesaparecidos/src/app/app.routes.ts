import { Routes } from '@angular/router';
// Importar componentes Standalone
import { RegistroComponent } from './components/registro/registro.component';
import { HomeComponent } from './components/home/home.component';
import { IniciarSesionComponent } from './components/iniciar-sesion/iniciar-sesion.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { FormAvistamientosComponent } from './components/form-avistamientos/form-avistamientos.component'; // Importar FormAvistamientosComponent
import { ForoAvistamientosComponent } from './components/foro-avistamientos/foro-avistamientos.component'; // Importar ForoAvistamientosComponent


export const routes: Routes = [
  { path: '', component: HomeComponent }, // Página principal
  { path: 'registro', component: RegistroComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: 'reportes', component: ReportesComponent }, // Asumo que es donde están las cards
  { path: 'perfil', component: PerfilComponent },

  // --- Rutas para Avistamientos y el Formulario ---
  { path: 'foro-avistamientos', component: ForoAvistamientosComponent }, // Ruta para el foro general
  { path: 'avistamientos/form', component: FormAvistamientosComponent }, // Ruta para crear nuevo avistamiento
  { path: 'avistamientos/form/:id', component: FormAvistamientosComponent }, // Ruta para editar avistamiento (con ID)
  // -----------------------------------------------


  { path: '**', redirectTo: '' } // Redirigir rutas no encontradas
];

// Si usas standalone components y provideRouter, es probable que no necesites app-routing.module.ts
// ni declaraciones/imports de componentes Standalone en app.module.ts.