import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../services/reportes.service';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
import { UsuarioService } from '../../services/usuario.service';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-form-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-reportes.component.html',
  styleUrls: ['./form-reportes.component.scss']
})
export class FormReportesComponent implements OnInit, OnDestroy {
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
  fechaMaxima: string = '';
  ubicacionSeleccionada: boolean = false;
  archivoSeleccionado: boolean = false;
  nombreArchivo: string = '';
  enviandoReporte: boolean = false;
  currentUserEmail: string | null = null;
  isLoadingMap = false;
  mapError: string | null = null;
  ubicacionLegible: string = '';

  private authStateSubscription: Subscription | undefined;

  constructor(
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService,
    private geocodificacionService: GeocodificacionService,
    public mapService: MapService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('[FORM-REPORTES] Componente construido.');
  }

  ngOnInit(): void {
    console.log('[FORM-REPORTES] ngOnInit iniciado.');
    
    // Configurar fecha máxima (ayer)
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    this.fechaMaxima = ayer.toISOString().split('T')[0];

    if (isPlatformBrowser(this.platformId)) {
      console.log('[FORM-REPORTES] Navegador detectado.');
      
      // Suscribirse al estado de autenticación
      this.authStateSubscription = this.usuarioService.currentUserEmail$.subscribe(email => {
        console.log('[FORM-REPORTES] Estado de autenticación cambiado. Email actual:', email);
        this.currentUserEmail = email;
        this.cdr.detectChanges();
      });

      // Inicializar mapa después de un delay
      setTimeout(() => {
        this.inicializarMapa();
      }, 500);
    } else {
      console.warn('[FORM-REPORTES] No se ejecuta en navegador (SSR), omitiendo lógica.');
    }
  }

  ngOnDestroy(): void {
    console.log('[FORM-REPORTES] ngOnDestroy iniciado.');
    
    // Limpiar mapa
    this.limpiarMapa();
    
    // Desuscribirse de observables
    if (this.authStateSubscription) {
      console.log('[FORM-REPORTES] Desuscribiendo de authStateSubscription');
      this.authStateSubscription.unsubscribe();
    }
    
    console.log('[FORM-REPORTES] ngOnDestroy finalizado.');
  }

  formularioCompleto(): boolean {
    return !!(this.nuevoReporte.nombre && 
      this.nuevoReporte.fechaDesaparicion && 
      this.ubicacionSeleccionada);
  }

  private async inicializarMapa(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('[FORM-REPORTES] No se puede inicializar mapa: No es navegador.');
      return;
    }

    if (this.mapa) {
      console.log('[FORM-REPORTES] Mapa ya inicializado.');
      return;
    }

    try {
      console.log('[FORM-REPORTES] Intentando inicializar el mapa...');
      
      const mapElement = document.getElementById('mapa');
      if (!mapElement) {
        console.error('[FORM-REPORTES] No se encontró el elemento con ID "mapa" en el DOM');
        this.mapError = 'Elemento del mapa no encontrado en el DOM.';
        return;
      }

      // Asegurar dimensiones del contenedor
      mapElement.style.height = '400px';
      mapElement.style.width = '100%';

      // Crear mapa usando MapService
      const coordsIniciales: [number, number] = [-17.3935, -66.1570]; // Cochabamba
      this.mapa = this.mapService.crearMapa('mapa', coordsIniciales);
      
      if (!this.mapa) {
        throw new Error('El MapService devolvió un mapa nulo.');
      }

      console.log('[FORM-REPORTES] Mapa inicializado correctamente');

      // Configurar evento de clic en el mapa
      this.mapa.on('click', async (e: L.LeafletMouseEvent) => {
        await this.manejarClicMapa(e);
      });

      // Invalidar tamaño después de un delay
      setTimeout(() => {
        if (this.mapa) {
          this.mapa.invalidateSize();
          console.log('[FORM-REPORTES] Tamaño del mapa invalidado.');
        }
      }, 100);

    } catch (error: any) {
      console.error('[FORM-REPORTES] Error al inicializar el mapa:', error);
      this.mapError = `Error al inicializar el mapa: ${error.message || 'Error desconocido'}`;
      this.cdr.detectChanges();
    }
  }

  private async manejarClicMapa(e: L.LeafletMouseEvent): Promise<void> {
    const latlng = e.latlng;
    const coordenadas = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    
    console.log('[FORM-REPORTES] Coordenadas seleccionadas:', coordenadas);
    
    // Actualizar datos del reporte
    this.nuevoReporte.lugarDesaparicion = coordenadas;
    this.ubicacionSeleccionada = true;
    this.ubicacionLegible = 'Obteniendo dirección...';

    // Limpiar marcador anterior
    if (this.marcador && this.mapa) {
      this.mapa.removeLayer(this.marcador);
    }

    // Crear marcador manualmente (como en el código original)
    if (this.mapa) {
      const marcadorIcono = L.icon({
        iconUrl: 'assets/images/marker-icon.png', 
        iconSize: [25, 41], 
        iconAnchor: [12, 41], 
        popupAnchor: [1, -34], 
        shadowUrl: 'assets/images/marker-shadow.png',  
        shadowSize: [41, 41] 
      });
      
      this.marcador = L.marker(latlng, { icon: marcadorIcono }).addTo(this.mapa);
    }

    // Geocodificar coordenadas para obtener dirección legible
    try {
      const direccion = await this.geocodificacionService.obtenerDireccionDesdeCoordenadas(
        latlng.lat, 
        latlng.lng
      ).toPromise();
      
      this.ubicacionLegible = direccion || coordenadas;
      console.log('[FORM-REPORTES] Dirección obtenida:', this.ubicacionLegible);
    } catch (error) {
      console.warn('[FORM-REPORTES] Error al geocodificar:', error);
      this.ubicacionLegible = coordenadas;
    }

    this.cdr.detectChanges();
  }

  onFileSelected(event: any): void {
    console.log('[FORM-REPORTES] Procesando selección de archivo...');
    
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.archivoSeleccionado = true;
      this.nombreArchivo = file.name;
      
      console.log('[FORM-REPORTES] Archivo seleccionado:', file.name);

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result;
        console.log('[FORM-REPORTES] Imagen cargada y mostrada en preview');
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('[FORM-REPORTES] No se seleccionó ningún archivo');
      this.archivoSeleccionado = false;
      this.nombreArchivo = '';
      this.selectedFile = null;
      this.imagenPreview = null;
    }
  }

  async crearReporte(): Promise<void> {
    console.log('[FORM-REPORTES] Intentando crear un nuevo reporte...');
    
    // Validar campos obligatorios
    if (!this.nuevoReporte.nombre || !this.nuevoReporte.fechaDesaparicion || !this.nuevoReporte.lugarDesaparicion) {
      console.warn('[FORM-REPORTES] Faltan campos obligatorios');
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    this.enviandoReporte = true;
    this.cdr.detectChanges();

    try {
      // Verificar permisos con feature flags
      const flagActivo = await this.featureFlagsService.getFeatureFlag('create-reports').toPromise();
      const puedeCrear = flagActivo || !!this.currentUserEmail;
      
      console.log('[FORM-REPORTES] ¿Autorizado para crear reporte?', puedeCrear);

      if (!puedeCrear) {
        console.warn('[FORM-REPORTES] No tienes permisos para crear reportes');
        alert('No tienes permisos para crear reportes. Por favor, inicia sesión.');
        return;
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('nombre', this.nuevoReporte.nombre);
      formData.append('edad', this.nuevoReporte.edad?.toString() || '');
      formData.append('fechaDesaparicion', this.nuevoReporte.fechaDesaparicion);
      formData.append('lugarDesaparicion', this.nuevoReporte.lugarDesaparicion);
      formData.append('descripcion', this.nuevoReporte.descripcion || '');

      // Determinar email
      const emailFinal = this.currentUserEmail || (flagActivo ? 'anonimo@gmail.com' : null);
      if (emailFinal) {
        formData.append('emailReportaje', emailFinal);
      }

      // Agregar archivo si existe
      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
        console.log('[FORM-REPORTES] Archivo incluido en el formulario:', this.selectedFile.name);
      }

      console.log('[FORM-REPORTES] Enviando reporte con datos:', {
        email: emailFinal,
        reporte: this.nuevoReporte,
        tieneArchivo: !!this.selectedFile
      });

      // Enviar reporte
      const reporteCreado = await this.reportesService.crearReporte(formData).toPromise();
      
      console.log('[FORM-REPORTES] Reporte creado con éxito:', reporteCreado);
      alert('Reporte creado exitosamente.');
      this.resetForm();

    } catch (error: any) {
      console.error('[FORM-REPORTES] Error al crear el reporte:', error);
      
      const errorMsg = error?.error;
      if (typeof errorMsg === 'string' && errorMsg.includes("La persona no está registrada en la página de la policía boliviana de desaparecidos.")) {
        alert('No se puede crear el reporte: la persona debe estar registrada oficialmente en la página de la Policía Boliviana de Desaparecidos.');
      } else {
        alert('Ocurrió un error al crear el reporte. Por favor, intenta nuevamente.');
      }
    } finally {
      this.enviandoReporte = false;
      this.cdr.detectChanges();
    }
  }

  resetForm(): void {
    console.log('[FORM-REPORTES] Reseteando formulario...');
    
    // Resetear datos del formulario
    this.nuevoReporte = {
      nombre: '',
      edad: null,
      fechaDesaparicion: '',
      lugarDesaparicion: '',
      descripcion: ''
    };

    // Resetear estado de archivo
    this.selectedFile = null;
    this.imagenPreview = null;
    this.archivoSeleccionado = false;
    this.nombreArchivo = '';

    // Resetear estado de ubicación
    this.ubicacionSeleccionada = false;
    this.ubicacionLegible = '';

    // Limpiar marcador del mapa
    if (this.marcador && this.mapa) {
      this.mapa.removeLayer(this.marcador);
      this.marcador = null;
    }

    // Resetear estados de error y carga
    this.enviandoReporte = false;
    this.mapError = null;

    console.log('[FORM-REPORTES] Formulario reseteado');
    this.cdr.detectChanges();
  }

  private limpiarMapa(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    console.log('[FORM-REPORTES] Limpiando mapa...');
    
    if (this.mapa) {
      this.mapService.eliminarMapa(this.mapa);
      this.mapa = null;
      this.marcador = null;
    }
    
    console.log('[FORM-REPORTES] Mapa limpiado.');
  }
}