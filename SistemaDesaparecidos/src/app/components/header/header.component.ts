import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule, RouterModule], 
})

export class HeaderComponent implements OnInit{
  estaLogueado = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    console.log('📘 HeaderComponent creado');
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const email = localStorage.getItem('email');
      this.estaLogueado = !!email;
      console.log('🔑 Usuario logueado:', this.estaLogueado, '| Email:', email ?? 'No hay email');
    }
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('🚪 Cerrando sesión del usuario...');
      localStorage.removeItem('email');
      window.location.href = '/';
    }
  }
}
