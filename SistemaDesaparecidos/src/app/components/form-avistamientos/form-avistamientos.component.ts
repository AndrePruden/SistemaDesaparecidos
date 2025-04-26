import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
      idDesaparecido: ''
    }
  };

  mensaje: string = '';
  reportes: any[] = [];

  constructor(private reportesService: ReportesService) {
    console.log('👁️ FormAvistamientosComponent inicializado');
  }

  ngOnInit(): void {
    this.reportesService.obtenerReportes().subscribe({
      next: (data) => {
        this.reportes = data;
        console.log('📥 Reportes cargados:', this.reportes);
      },
      error: (err) => {
        console.error('❌ Error al cargar reportes:', err);
      }
    });
  }

  crearAvistamiento(): void {
    console.log('📤 Intentando crear un nuevo avistamiento...');
    const emailUsuario = localStorage.getItem('email');
    console.log('📧 Email del usuario:', emailUsuario);

    if (
      emailUsuario &&
      this.nuevoAvistamiento.fecha &&
      this.nuevoAvistamiento.lugar &&
      this.nuevoAvistamiento.personaDesaparecida.idDesaparecido
    ) {
      const avistamientoData = {
        ...this.nuevoAvistamiento,
        emailUsuario: emailUsuario
      };

      console.log('📋 Datos del avistamiento (JSON):', avistamientoData);

      this.reportesService.crearAvistamiento(avistamientoData).subscribe({
        next: (avistamientoCreado: any) => {
          console.log('✅ Avistamiento creado con éxito:', avistamientoCreado);
          this.resetForm();
        },
        error: (error: any) => {
          console.error('❌ Error al crear el avistamiento:', error);
        }
      });
    } else {
      console.warn('⚠️ Por favor llena todos los campos obligatorios');
    }
  }

  resetForm(): void {
    this.nuevoAvistamiento = {
      fecha: '',
      lugar: '',
      descripcion: '',
      personaDesaparecida: {
        idDesaparecido: ''
      }
    };
    console.log('🔄 Formulario de avistamiento reseteado');
  }
}
