import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../services/reportes.service';
import { FeatureFlagsService } from '../../services/feature-flags.service';

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

  // Nuevas propiedades para mapa
  leaflet: any;
  mapa: any;
  marcador: any;
  mapaVisible = false;

  constructor(
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService
  ) {
    console.log('📄 FormReportesComponent inicializado');
  }

  async ngAfterViewInit() {
    // Cargar módulo de Leaflet
    const leafletModule = await import('leaflet');
    this.leaflet = leafletModule;

    // Inicializar mapa después de que la vista se haya cargado
    this.inicializarMapa();
  }

  inicializarMapa(): void {
    // Comprobar si el mapa ya está inicializado
    if (this.mapa) return;  // Si ya existe el mapa, no lo inicializamos de nuevo
  
    // Inicializar el mapa
    this.mapa = this.leaflet.map('mapa').setView([-17.3935, -66.1570], 13);
    
    // Cargar las capas del mapa
    this.leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapa);
  
    // Crear un ícono predeterminado para el marcador
    const iconoMarcador = this.leaflet.icon({
      iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png', // URL del ícono del marcador
      iconSize: [25, 41], // Tamaño del ícono
      iconAnchor: [12, 41], // Donde el punto de anclaje del ícono estará (al pie del marcador)
      popupAnchor: [1, -34], // Lugar donde el popup debería abrirse
      shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png', // Sombra del marcador
      shadowSize: [41, 41] // Tamaño de la sombra
    });
  
    // Evento de clic en el mapa
    this.mapa.on('click', (e: any) => {
      const latlng = e.latlng;  // Capturar las coordenadas del clic en el mapa
  
      // Asignar las coordenadas al campo lugarDesaparicion
      this.nuevoReporte.lugarDesaparicion = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
      console.log('📍 Coordenadas seleccionadas:', this.nuevoReporte.lugarDesaparicion);
  
      // Si ya hay un marcador, lo eliminamos
      if (this.marcador) {
        this.mapa.removeLayer(this.marcador);
      }
  
      // Añadir un nuevo marcador con el ícono personalizado
      this.marcador = this.leaflet.marker(latlng, { icon: iconoMarcador }).addTo(this.mapa);
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
