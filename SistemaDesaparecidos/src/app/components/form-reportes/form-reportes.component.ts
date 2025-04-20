import { Component } from '@angular/core';
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

  constructor(private reportesService: ReportesService) {
    console.log('📄 FormReportesComponent inicializado');
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('📎 Archivo seleccionado:', file.name);

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result;
        console.log('🖼️ Imagen cargada y mostrada en preview');
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('⚠️ No se seleccionó ningún archivo');
    }
  }

  crearReporte(): void {
    console.log('📤 Intentando crear un nuevo reporte...');
    const emailUsuario = localStorage.getItem('email');
    console.log('📧 Email del usuario:', emailUsuario);

    if (emailUsuario && this.nuevoReporte.nombre && this.nuevoReporte.fechaDesaparicion && this.nuevoReporte.lugarDesaparicion) {
      const formData = new FormData();
      formData.append('nombre', this.nuevoReporte.nombre);
      formData.append('edad', this.nuevoReporte.edad);
      formData.append('fechaDesaparicion', this.nuevoReporte.fechaDesaparicion);
      formData.append('lugarDesaparicion', this.nuevoReporte.lugarDesaparicion);
      formData.append('descripcion', this.nuevoReporte.descripcion);
      formData.append('emailReportaje', emailUsuario);

      console.log('📋 Datos del reporte:', this.nuevoReporte);

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
        console.log('📎 Archivo incluido en el formulario:', this.selectedFile.name);
      } else {
        console.log('📎 No se adjuntó imagen al reporte');
      }

      this.reportesService.crearReporte(formData).subscribe({
        next: (reporteCreado: any) => {
          console.log('✅ Reporte creado con exito:', reporteCreado);
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
    console.log('🔄 Formulario reseteado');
  }
}
