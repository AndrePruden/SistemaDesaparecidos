import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../services/reportes.service';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import * as L from 'leaflet';

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

  //leaflet: any;
  mapa: L.Map | null = null;
  marcador: L.Marker | null = null;
  mapaVisible = false;

  constructor(
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService
  ) {
    console.log('📄 FormReportesComponent inicializado');
  }

  ngOnInit() {
    this.inicializarMapa();
  }

  inicializarMapa(): void {
    // 1. Verifica si el contenedor existe
    const container = document.getElementById('mapa');
    if (!container) {
      console.error('No se encontró el elemento con id "mapa"');
      return;
    }

    // 2. Configura íconos para producción (¡importante!)
    this.fixLeafletIcons();

    // 3. Inicializa el mapa
    this.mapa = L.map('mapa').setView([-17.3935, -66.1570], 13);

    // 4. Añade capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapa);

    // 5. Configura el evento de clic
    this.configurarEventos();
  }

  private fixLeafletIcons() {
    // Solución para íconos en producción
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet-images/marker-icon-2x.png',
      iconUrl: 'assets/leaflet-images/marker-icon.png',
      shadowUrl: 'assets/leaflet-images/marker-shadow.png'
    });
  }

  private configurarEventos() {
    if (!this.mapa) return;

    this.mapa.on('click', (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      this.nuevoReporte.lugarDesaparicion = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
      
      // Elimina marcador existente
      if (this.marcador) {
        this.mapa?.removeLayer(this.marcador);
      }

      // Añade nuevo marcador
      this.marcador = L.marker(latlng).addTo(this.mapa!);
    });
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

    if (!this.nuevoReporte.nombre || !this.nuevoReporte.fechaDesaparicion || !this.nuevoReporte.lugarDesaparicion) {
      console.warn('⚠️ Faltan campos obligatorios');
      return;
    }

    // Consultar si el feature flag 'create-reports' está activo
    this.featureFlagsService.getFeatureFlag('create-reports').subscribe({
      next: (flagActivo: boolean) => {
        const puedeCrear = flagActivo || !!emailUsuario;
        console.log('🚦 ¿Autorizado para crear reporte?', puedeCrear);

        if (puedeCrear) {
          const formData = new FormData();
          formData.append('nombre', this.nuevoReporte.nombre);
          formData.append('edad', this.nuevoReporte.edad);
          formData.append('fechaDesaparicion', this.nuevoReporte.fechaDesaparicion);
          formData.append('lugarDesaparicion', this.nuevoReporte.lugarDesaparicion);
          formData.append('descripcion', this.nuevoReporte.descripcion);

          // Si el usuario no está logueado pero el feature flag está activo, usar correo anónimo
          const emailFinal = emailUsuario || (flagActivo ? 'anonimo@gmail.com' : null);
          if (emailFinal) {
            formData.append('emailReportaje', emailFinal);
          }

          console.log('📋 Datos del reporte:', emailFinal, this.nuevoReporte);

          if (this.selectedFile) {
            formData.append('file', this.selectedFile);
            console.log('📎 Archivo incluido en el formulario:', this.selectedFile.name);
          } else {
            console.log('📎 No se adjuntó imagen al reporte');
          }

          this.reportesService.crearReporte(formData).subscribe({
            next: (reporteCreado: any) => {
              console.log('✅ Reporte creado con éxito:', reporteCreado);
              this.resetForm();
            },
            error: error => {
              console.error('❌ Error al crear el reporte:', error);

              const errorMsg = error?.error;
              
              if (typeof errorMsg === 'string' && errorMsg.includes("La persona no está registrada en la página de la policía boliviana de desaparecidos.")) {
                alert('❌ No se puede crear el reporte: la persona debe estar registrada oficialmente en la página de la Policía Boliviana de Desaparecidos.');
              } else {
                alert('❌ Ocurrió un error al crear el reporte. Por favor, intenta nuevamente.');
              }
            }
          });
        } else {
          console.warn('⚠️ No tienes permisos para crear reportes');
        }
      },
      error: (error) => {
        console.error('❌ Error al consultar el feature flag:', error);
      }
    });
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
