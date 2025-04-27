import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CardsReportesComponent } from '../cards-reportes/cards-reportes.component';
import { FormAvistamientosComponent } from '../form-avistamientos/form-avistamientos.component';
import { ForoAvistamientosComponent } from '../foro-avistamientos/foro-avistamientos.component';
import { FormReportesComponent } from '../form-reportes/form-reportes.component';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    CardsReportesComponent,
    ForoAvistamientosComponent,
    FormReportesComponent,
    FormAvistamientosComponent
  ],
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  emailUsuario: string | null = null;
  estaLogueado: boolean = false;
  puedeCrearReportes: boolean = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private featureFlagsService: FeatureFlagsService
  ) {}

  ngOnInit(): void {
    console.log('🔍 Inicializando ReportesComponent');
    if (isPlatformBrowser(this.platformId)) {
      console.log('🌐 Plataforma del navegador detectada');
      this.verificarSesion();
      this.verificarPermisosParaCrearReportes();
    }
  }

  verificarSesion(): void {
    console.log('🔑 Verificando sesión del usuario...');
    this.emailUsuario = localStorage.getItem('email');
    this.estaLogueado = !!this.emailUsuario;
    if (this.estaLogueado) {
      console.log(`✅ Usuario logueado con correo: ${this.emailUsuario}`);
    } else {
      console.log('⚠️ No hay usuario logueado');
    }
  }

  verificarPermisosParaCrearReportes(): void {
    if (this.estaLogueado) {
      this.puedeCrearReportes = true;
      console.log('🚦 Usuario logueado, puede crear reportes');
    } else {
      this.featureFlagsService.getFeatureFlag('create-reports').subscribe({
        next: (flagActivo: boolean) => {
          this.puedeCrearReportes = flagActivo;
          console.log(`🚦 Feature 'create-reports' consultado. ¿Puede crear reportes? ${this.puedeCrearReportes}`);
        },
        error: (error) => {
          console.error('❌ Error al consultar el feature flag:', error);
          this.puedeCrearReportes = false;
        }
      });
    }
  }

  cerrarSesion(): void {
    console.log('🚪 Cerrando sesión...');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('email');
      this.estaLogueado = false;
      this.emailUsuario = null;
      this.puedeCrearReportes = false;
      console.log('✔️ Usuario desconectado');
      this.router.navigate(['/']);
    }
  }
}
