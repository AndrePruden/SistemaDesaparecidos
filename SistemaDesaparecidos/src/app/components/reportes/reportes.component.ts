import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  reportes: any[] = [];
  nuevoReporte = {
    nombre: '',
    edad: null,
    fechaDesaparicion: '',
    lugarDesaparicion: '',
    descripcion: ''
  };
  emailUsuario: string | null = null; // Email del usuario logueado
  estaLogueado: boolean = false; // Estado de la sesión

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.verificarSesion();
      this.obtenerReportes();
    }
  }

  // Verificar si el usuario ha iniciado sesión
  verificarSesion(): void {
    this.emailUsuario = localStorage.getItem('email');
    this.estaLogueado = !!this.emailUsuario; // true si hay email, false si no
  }

  obtenerReportes(): void {
    this.http.get<any[]>('http://localhost:8080/reportes/todos').subscribe(
      (data) => {
        this.reportes = data;
      },
      (error) => {
        console.error('Error al obtener reportes:', error);
      }
    );
  }

  // Crear un nuevo reporte
  crearReporte(): void {
    if (this.emailUsuario) {
      const reporte = { ...this.nuevoReporte, emailReportaje: this.emailUsuario };
      this.http.post('http://localhost:8080/reportes/crear', reporte).subscribe(
        (response) => {
          console.log('Reporte creado:', response);
          this.obtenerReportes(); // Actualizar la lista de reportes
          this.nuevoReporte = { // Limpiar el formulario
            nombre: '',
            edad: null,
            fechaDesaparicion: '',
            lugarDesaparicion: '',
            descripcion: ''
          };
        },
        (error) => {
          console.error('Error al crear reporte:', error);
        }
      );
    }
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('email');
      this.estaLogueado = false;
      this.emailUsuario = null;
      this.router.navigate(['/']); // Redirigir a la página principal
    }
  }
}