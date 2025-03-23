import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.obtenerReportes();
    }
  }

  obtenerReportes(): void {
    const email = localStorage.getItem('email');
    if (email) {
      this.http.get<any[]>(`http://localhost:8080/reportes/usuario/${email}`).subscribe(
        (data) => {
          this.reportes = data;
        },
        (error) => {
          console.error('Error al obtener reportes:', error);
        }
      );
    }
  }

  crearReporte(): void {
    if (isPlatformBrowser(this.platformId)) {
      const email = localStorage.getItem('email');
      if (email) {
        const reporte = { ...this.nuevoReporte, emailReportaje: email };
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
  }
}