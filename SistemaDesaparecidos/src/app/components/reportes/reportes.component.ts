import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FeatureToggleService } from '../../services/feature-toggle.service';
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

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private featureToggleService: FeatureToggleService
  ) {}

  ngOnInit(): void {
    console.log('🔍 Inicializando ReportesComponent');
    if (isPlatformBrowser(this.platformId)) {
      console.log('🌐 Plataforma del navegador detectada');
      this.verificarSesion();
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

  cerrarSesion(): void {
    console.log('🚪 Cerrando sesión...');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('email');
      this.estaLogueado = false;
      this.emailUsuario = null;
      console.log('✔️ Usuario desconectado');
      this.router.navigate(['/']);
    }
  }
}
