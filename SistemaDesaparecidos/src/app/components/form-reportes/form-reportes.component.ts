import { Component } from '@angular/core';
<<<<<<< Updated upstream

@Component({
  selector: 'app-form-reportes',
  imports: [],
  templateUrl: './form-reportes.component.html',
  styleUrl: './form-reportes.component.scss'
})
export class FormReportesComponent {

=======
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../services/reportes.service';

@Component({
  selector: 'app-form-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-reportes.component.html',
  styleUrls: ['./form-reportes.component.scss']
})
export class FormReportesComponent {
  nuevoReporte: any = {
    nombre: '',
    edad: null,
    fechaDesaparicion: '',
    lugarDesaparicion: '',
    descripcion: ''
  };

  selectedFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  mensaje: string = '';

  constructor(private reportesService: ReportesService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview = reader.result;
    };
    reader.readAsDataURL(file);
  }
  }

  crearReporte(): void {
    const emailUsuario = localStorage.getItem('email');

    if (emailUsuario && this.nuevoReporte.nombre && this.nuevoReporte.fechaDesaparicion && this.nuevoReporte.lugarDesaparicion) {
      const formData = new FormData();
      formData.append('nombre', this.nuevoReporte.nombre);
      formData.append('edad', this.nuevoReporte.edad);
      formData.append('fechaDesaparicion', this.nuevoReporte.fechaDesaparicion);
      formData.append('lugarDesaparicion', this.nuevoReporte.lugarDesaparicion);
      formData.append('descripcion', this.nuevoReporte.descripcion);
      formData.append('emailReportaje', emailUsuario);

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      }

      this.reportesService.crearReporte(formData).subscribe({
        next: (reporteCreado: any) => {
          console.log('✅ Reporte creado con imagen:', reporteCreado);
          this.resetForm();
        },
        error: error => {
          console.error('❌ Error al crear el reporte:', error);
        }
      });
    } else {
      console.warn('⚠️ Por favor llena todos los campos obligatorios');
    }
  }

  resetForm(): void {
    this.nuevoReporte = {
      nombre: '',
      edad: null,
      fechaDesaparicion: '',
      lugarDesaparicion: '',
      descripcion: ''
    };
    this.selectedFile = null;
    this.imagenPreview = null;
  }
>>>>>>> Stashed changes
}
