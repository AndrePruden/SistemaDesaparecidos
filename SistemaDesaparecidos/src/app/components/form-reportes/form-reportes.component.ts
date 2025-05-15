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

  mapa: L.Map | null = null;
  marcador: L.Marker | null = null;
  mapaVisible = false;

  constructor(
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService
  ) {
    console.log('📄 FormReportesComponent inicializado');
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.inicializarMapa();
    }, 500); // Un pequeño retraso para asegurar que el DOM esté listo
  }

  inicializarMapa(): void {
    // Comprobar si el mapa ya está inicializado
    if (this.mapa) return;  // Si ya existe el mapa, no lo inicializamos de nuevo
    
    try {
      console.log('Intentando inicializar el mapa...');
      const mapElement = document.getElementById('mapa');
      
      if (!mapElement) {
        console.error('No se encontró el elemento con ID "mapa" en el DOM');
        return;
      }

      // Configurar las rutas de los iconos de Leaflet
      const iconDefault = L.Icon.Default.prototype;
      iconDefault.options.iconUrl = 'assets/images/marker-icon.png';
      iconDefault.options.iconRetinaUrl = 'assets/images/marker-icon-2x.png';
      iconDefault.options.shadowUrl = 'assets/images/marker-shadow.png';
      iconDefault.options.iconSize = [25, 41];
      iconDefault.options.iconAnchor = [12, 41];
      iconDefault.options.popupAnchor = [1, -34];
      iconDefault.options.shadowSize = [41, 41];
  
      // Inicializar el mapa
      this.mapa = L.map('mapa').setView([-17.3935, -66.1570], 13);
      
      // Cargar las capas del mapa
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.mapa);

      console.log('Mapa inicializado correctamente');
  
      // Evento de clic en el mapa
      this.mapa.on('click', (e: L.LeafletMouseEvent) => {
        const latlng = e.latlng;  // Capturar las coordenadas del clic en el mapa
    
        // Asignar las coordenadas al campo lugarDesaparicion
        this.nuevoReporte.lugarDesaparicion = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
        console.log('📍 Coordenadas seleccionadas:', this.nuevoReporte.lugarDesaparicion);
    
        // Si ya hay un marcador, lo eliminamos
        if (this.marcador && this.mapa) {
          this.mapa.removeLayer(this.marcador);
        }
    
        // Añadir un nuevo marcador
        this.marcador = L.marker(latlng).addTo(this.mapa!);
      });
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
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