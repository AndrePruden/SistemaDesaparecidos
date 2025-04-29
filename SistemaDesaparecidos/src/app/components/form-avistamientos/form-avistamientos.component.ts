import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { ReportesService } from '../../services/reportes.service';

@Component({
  selector: 'app-form-avistamientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-avistamientos.component.html',
  styleUrls: ['./form-avistamientos.component.scss']
})
export class FormAvistamientosComponent implements OnInit {
  nuevoAvistamiento: any = {
    fecha: '',
    lugar: '',
    descripcion: '',
    personaDesaparecida: {
      idDesaparecido: null
    }
  };

  reportes: any[] = [];
  mensaje: string = '';

  constructor(
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.reportesService.obtenerReportes().subscribe({
      next: (data) => {
        this.reportes = data;
        console.log('Reportes cargados:', this.reportes);
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
      }
    });
  }

  crearAvistamiento(): void {
    const emailUsuario = localStorage.getItem('email');
  
    if (!emailUsuario) {
      this.mensaje = 'Debes iniciar sesión para reportar un avistamiento';
      console.error(this.mensaje);
      return;
    }
  
    if (!this.nuevoAvistamiento.personaDesaparecida.idDesaparecido) {
      this.mensaje = 'Debes seleccionar un reporte válido';
      console.error(this.mensaje);
      return;
    }
  
    const avistamientoData = {
      emailUsuario: emailUsuario,
      personaDesaparecida: {
        idDesaparecido: this.nuevoAvistamiento.personaDesaparecida.idDesaparecido
      },
      fecha: this.nuevoAvistamiento.fecha,
      ubicacion: this.nuevoAvistamiento.lugar,
      descripcion: this.nuevoAvistamiento.descripcion
    };
  
    console.log('Enviando avistamiento:', avistamientoData);
  
    this.avistamientosService.crearAvistamiento(avistamientoData).subscribe({
      next: (response) => {
        console.log('Avistamiento creado:', response);
        this.mensaje = 'Avistamiento registrado con éxito';
        this.resetForm();
      },
      error: (error) => {
        console.error('Error al crear avistamiento:', error);
        this.mensaje = 'Error al registrar el avistamiento';
      }
    });
  }
  

  resetForm(): void {
    this.nuevoAvistamiento = {
      fecha: '',
      lugar: '',
      descripcion: '',
      personaDesaparecida: {
        idDesaparecido: null
      }
    };
  }
}