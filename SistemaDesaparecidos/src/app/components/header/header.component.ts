import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule, RouterModule], 
})

export class HeaderComponent implements OnInit{
  estaLogueado: boolean = false;
  puedeCrearReportes: boolean = false;
  emailUsuario: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private featureFlagsService: FeatureFlagsService,
    private router: Router
  ) {
    console.log('📘 HeaderComponent creado');
  }

  ngOnInit(): void {
    this.verificarSesion();
    this.verificarPermisosParaCrearReportes();
  }

  verificarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.emailUsuario = localStorage.getItem('email');
      this.estaLogueado = !!this.emailUsuario;
    }
  }

  verificarPermisosParaCrearReportes(): void {
    this.featureFlagsService.getFeatureFlag('create-reports').subscribe({
      next: (flagActivo: boolean) => {
        this.puedeCrearReportes = flagActivo;
        console.log('🚦 Feature create-reports activo:', this.puedeCrearReportes);
      },
      error: (error) => {
        console.error('❌ Error al consultar feature create-reports:', error);
      }
    });
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('🚪 Cerrando sesión del usuario...');
      localStorage.removeItem('email');
      this.estaLogueado = false;
      this.emailUsuario = null;
      this.router.navigate(['/']);
    }
  }

  verificarAccesoReportes(event: Event): void {
    console.log('Esta logueado? ', this.estaLogueado);
    console.log('Puede crear reportes? ', this.puedeCrearReportes);
    event.preventDefault(); 
    if (this.estaLogueado || this.puedeCrearReportes) {
      this.router.navigate(['/reportes']);
    }
    else {
      alert('Para acceder a los reportes debes iniciar sesión.');
    }
  }
}