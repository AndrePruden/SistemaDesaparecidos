import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AvistamientoService, Avistamiento } from '../../services/avistamiento.service';
import { ReportesService } from '../../services/reportes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FeatureFlagsService } from '../../services/feature-flags.service'; 
import * as L from 'leaflet';
import { UsuarioService } from '../../services/usuario.service'; 

interface DesaparecidoOficial {
  id: number; 
  nombre: string;
}

@Component({
  selector: 'app-form-avistamientos',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  templateUrl: './form-avistamientos.component.html',
  styleUrls: ['./form-avistamientos.component.scss']
})
export class FormAvistamientosComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('avistamientoForm') avistamientoForm!: NgForm; 
  public avistamientoFormData: Partial<Avistamiento> & { coordenadas?: string } = {
    idAvistamiento: undefined, 
    fecha: '',
    ubicacion: '', 
    descripcion: '',
    personaDesaparecida: { idDesaparecido: null, nombre: '' },
    emailUsuario: '',
    coordenadas: '' 
  };
  reportes: DesaparecidoOficial[] = []; 
  mensaje: string = ''; 
  isLoading = false; 
  isEditing = false; 
  fechaMaxima: string = '';
  public mapa: any; 
  private marcador: L.Marker | null = null;
  private iconoAvistamientoPersonalizado: L.Icon | null = null; 
  isLoadingMap = false; 
  mapInitError: string | null = null; 
  private paramMapSubscription: Subscription | undefined;
  selectedIdDesaparecido: number | null = null; 

  constructor(
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService, 
    private usuarioService: UsuarioService, 
    private route: ActivatedRoute, 
    public router: Router, 
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef 
  ) {
    console.log('[FORM] Componente construido.');
  }

  ngOnInit(): void {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    this.fechaMaxima = ayer.toISOString().split('T')[0];
    console.log('[FORM] ngOnInit iniciado.');
    this.cargarReportes();
    if (isPlatformBrowser(this.platformId)) {
      console.log('[FORM] Navegador detectado. Suscribiéndose a paramMap...');
      this.paramMapSubscription = this.route.paramMap.subscribe(params => {
        console.log('[DEBUG FORM] paramMap subscription triggered. Raw params:', params);
        const avistamientoIdParam = params.get('id');
        const avistamientoId = avistamientoIdParam ? +avistamientoIdParam : null;
        console.log('[DEBUG FORM] Parsed ID from URL:', avistamientoId);
        if (avistamientoId !== null && !isNaN(avistamientoId) && (this.avistamientoFormData.idAvistamiento !== avistamientoId || !this.isEditing)) {
          console.log(`[DEBUG FORM] Entering/Transitioning to Edit mode for ID: ${avistamientoId}`);
          this.resetForm(false); 
          this.avistamientoFormData.idAvistamiento = avistamientoId; 
          this.isEditing = true; 
          this.cargarAvistamientoParaEdicion(this.avistamientoFormData.idAvistamiento);
        }
        else if (!avistamientoId && (this.isEditing || this.avistamientoFormData.idAvistamiento !== undefined)) {
          console.log('[DEBUG FORM] Entering/Transitioning to Create mode.');
          this.resetForm(true);
          this.isEditing = false;
        }
        else {
          console.log('[DEBUG FORM] ParamMap triggered, but no significant mode change or data reload needed.');
          if (!this.mapa && this.mapContainer?.nativeElement) {
            console.log('[DEBUG FORM] Map not initialized yet, calling inicializarMapa from paramMap else branch.');
            setTimeout(() => this.inicializarMapa(), 50);
          }
        }
        this.cdr.detectChanges(); 
      });
    } else {
      console.warn('[FORM] No se ejecuta en navegador (SSR)');
    }
  }

  ngAfterViewInit(): void {
    console.log('[FORM] ngAfterViewInit iniciado.');
    if (isPlatformBrowser(this.platformId) && this.mapContainer?.nativeElement) {
      console.log('[FORM] Contenedor del mapa disponible. Inicializando mapa con un pequeño retraso...');
      setTimeout(() => {
        this.inicializarMapa();
        if (this.isEditing && this.avistamientoFormData.ubicacion && this.mapa && this.marcador === null) {
          const coords = this.parsearCoords(this.avistamientoFormData.ubicacion); 
          if(coords){
            console.log('[DEBUG FORM MAP] Setting initial marker/view after ngAfterViewInit map init (edit mode).');
            this.actualizarMarcadorMapa(coords);
            this.mapa.setView(coords, this.mapa.getZoom() > 6 ? this.mapa.getZoom() : 13); 
            this.mapa.invalidateSize(); 
          } else {
            console.warn('[DEBUG FORM MAP] Ubicación cargada no válida para setear marcador/vista en ngAfterViewInit:', this.avistamientoFormData.ubicacion);
          }
        }
        this.cdr.detectChanges();
      }, 100);
    } else if (!this.mapContainer?.nativeElement) {
      console.error('[FORM] ERROR - mapContainer.nativeElement es null en ngAfterViewInit. No se puede inicializar el mapa.');
      this.mapInitError = 'El contenedor del mapa no está disponible.';
      this.cdr.detectChanges(); 
    }
  }
  
  ngOnDestroy(): void {
    console.log('[FORM] ngOnDestroy iniciado.');
    this.limpiarMapa(); 
    if (this.paramMapSubscription) {
        console.log('[FORM] Cancelando suscripción paramMap');
        this.paramMapSubscription.unsubscribe();
    }
    console.log('[FORM] ngOnDestroy finalizado.');
  }
  
  private cargarAvistamientoParaEdicion(id: number): void {
    this.isLoading = true;
    this.mensaje = '';
    this.mapInitError = null;
    console.log(`[DEBUG FORM] Cargando datos de avistamiento con ID: ${id}`); 
    this.avistamientosService.obtenerAvistamientoPorId(id).subscribe({
    next: (avistamiento: Avistamiento) => {
      console.log('[DEBUG FORM] Datos de avistamiento para edición cargados:', avistamiento);
      this.avistamientoFormData.idAvistamiento = avistamiento.idAvistamiento;
      this.avistamientoFormData.descripcion = avistamiento.descripcion;
      this.avistamientoFormData.emailUsuario = avistamiento.emailUsuario;
      if (avistamiento.fecha) {
        try {
          const dateObj = new Date(avistamiento.fecha);
          if (!isNaN(dateObj.getTime())) { 
            this.avistamientoFormData.fecha = dateObj.toISOString().split('T')[0];
            console.log('[DEBUG FORM] Fecha formateada:', this.avistamientoFormData.fecha);
          } else {
            console.warn('[DEBUG FORM] Fecha del backend inválida:', avistamiento.fecha, '. Reseteando fecha.');
            this.avistamientoFormData.fecha = ''; 
          }
        } catch (e) {
          console.error('[DEBUG FORM] Error al parsear fecha del backend:', avistamiento.fecha, e);
          this.avistamientoFormData.fecha = '';
        }
      } else {
        this.avistamientoFormData.fecha = '';
      }

      this.avistamientoFormData.ubicacion = avistamiento.ubicacion;
      this.avistamientoFormData.coordenadas = avistamiento.ubicacion;
      console.log('[DEBUG FORM] Ubicación y coordenadas asignadas:', this.avistamientoFormData.ubicacion);

      if (avistamiento.personaDesaparecida &&
          (avistamiento.personaDesaparecida.idDesaparecido !== null && avistamiento.personaDesaparecida.idDesaparecido !== undefined ||
          avistamiento.personaDesaparecida.id !== null && avistamiento.personaDesaparecida.id !== undefined)) // Añadir check para 'id' también si backend lo usa
          {
        const personaId = avistamiento.personaDesaparecida.idDesaparecido ?? avistamiento.personaDesaparecida.id;
        this.selectedIdDesaparecido = (personaId !== null && personaId !== undefined) ? +personaId : null; // Asegurarse de que es number | null
        console.log('[DEBUG FORM] ID de persona desaparecida asignado a selectedIdDesaparecido:', this.selectedIdDesaparecido);     
      } else {
        this.selectedIdDesaparecido = null; 
        this.avistamientoFormData.personaDesaparecida = { idDesaparecido: null, nombre: '' };
        console.warn('[DEBUG FORM] No se encontró ID de persona desaparecida en los datos cargados. selectedIdDesaparecido = null.');
      }
      this.onPersonaDesaparecidaChange(this.selectedIdDesaparecido);

      if (this.mapa && this.avistamientoFormData.ubicacion) {
        const coords = this.parsearCoords(this.avistamientoFormData.ubicacion); 
        if(coords){
        console.log('[DEBUG FORM MAP] Actualizando marcador en mapa con coords cargadas (desde subscribe):', coords);
        this.actualizarMarcadorMapa(coords);
        this.mapa.setView(coords, this.mapa.getZoom() > 6 ? this.mapa.getZoom() : 13); 
        this.mapa.invalidateSize(); 
        console.log('[DEBUG FORM MAP] Mapa centrado y tamaño invalidado.');
      } else {
        console.warn('[DEBUG FORM MAP] Ubicación cargada no válida para el mapa (desde subscribe):', this.avistamientoFormData.ubicacion);
        this.mapInitError = 'Las coordenadas cargadas para la edición no son válidas.'; 
      }
    } else if (this.avistamientoFormData.ubicacion) {
      console.log('[DEBUG FORM MAP] Mapa aún no inicializado al cargar datos. Se intentará poner marcador/centrar en inicializarMapa o AfterViewInit.');
    } else {
      console.log('[DEBUG FORM MAP] No hay ubicación en los datos cargados, no se pondrá marcador inicial.');
    }
    this.isLoading = false;
    this.cdr.detectChanges();
    console.log('[DEBUG FORM] Datos de edición aplicados al formulario.');
    if (this.avistamientoForm) { this.avistamientoForm.form.markAsPristine(); }
  },
    error: (error) => {
      console.error('[DEBUG FORM] Error al cargar avistamiento para edición:', error); // Log de error
      this.mensaje = `Error al cargar: ${error.status === 404 ? 'Avistamiento no encontrado.' : error.status === 403 ? 'No tienes permiso para editar este avistamiento.' : (error.message || 'Error desconocido')}`;
      this.isLoading = false; 
      this.mapInitError = 'No se pudo cargar el avistamiento para mostrar la ubicación.';
      this.cdr.detectChanges();
      this.resetForm(true); 
      this.router.navigate(['/reportes']); 
    },
  });
  }

  private inicializarMapa(): void {
    console.log('[DEBUG FORM MAP] Iniciando inicialización del mapa.'); 
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('[DEBUG FORM MAP] No se puede inicializar mapa: No es navegador.');
      this.mapInitError = 'Funcionalidad de mapa no disponible.';
      this.isLoadingMap = false;
      this.cdr.detectChanges();
      return;
    }
    if (!this.mapContainer?.nativeElement) {
      console.error('[DEBUG FORM MAP] ERROR - mapContainer.nativeElement es null. No se puede inicializar el mapa.'); 
      this.mapInitError = 'Error interno: Contenedor del mapa no encontrado.'; 
      this.isLoadingMap = false; 
      this.cdr.detectChanges();
      return;
    }
    if (this.mapa) {
      console.log('[DEBUG FORM MAP] Mapa ya inicializado. Limpiando instancia existente.');
      this.limpiarMapa(); 
    }
    this.isLoadingMap = true; 
    this.mapInitError = null;
    const container = this.mapContainer.nativeElement;
    container.style.height = '400px';
    container.style.width = '100%'; 
    container.style.margin = '1rem 0'; 
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #ddd';
    console.log('[DEBUG FORM MAP] Dimensiones y estilos del contenedor del mapa aseguradas.');

    try {
      if (!this.iconoAvistamientoPersonalizado) {
        this.iconoAvistamientoPersonalizado = L.icon({
          iconUrl: 'assets/images/marker-icon.png',
          iconRetinaUrl: 'assets/images/marker-icon-2x.png', 
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
          shadowUrl: 'assets/images/marker-shadow.png',
          shadowSize: [41, 41], shadowAnchor: [12, 41]
        });
        console.log('[DEBUG FORM MAP] Icono personalizado de marcador creado.');
      }
      const initialCenter: [number, number] = (this.isEditing && this.avistamientoFormData.ubicacion)
            ? this.parsearCoords(this.avistamientoFormData.ubicacion) || [-17.3935, -66.1570] 
            : [-17.3935, -66.1570]; 

      this.mapa = L.map(container, {
        center: initialCenter,
        zoom: 13,
        zoomControl: true, 
      });
      console.log('[DEBUG FORM MAP] Instancia de mapa creada con centro inicial:', initialCenter);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3,
        noWrap: false 
      }).addTo(this.mapa);
      console.log('[DEBUG FORM MAP] Capa de OpenStreetMap añadida.');

      this.mapa.on('click', (e: L.LeafletMouseEvent) => this.manejarClickMapa(e));
      console.log('[DEBUG FORM MAP] Event listener para click en mapa añadido.');

      if (this.isEditing && this.avistamientoFormData.ubicacion) {
        const coords = this.parsearCoords(this.avistamientoFormData.ubicacion); 
        if(coords){
          console.log('[DEBUG FORM MAP] Poniendo marcador inicial (edición) en inicializarMapa:', coords);
          this.actualizarMarcadorMapa(coords);
        } else {
          console.warn('[DEBUG FORM MAP] Ubicación cargada no válida para poner marcador inicial en inicializarMapa:', this.avistamientoFormData.ubicacion);
          this.mapInitError = 'Las coordenadas cargadas para la edición no son válidas.'; // Mostrar error en UI del mapa
        }
      } else {
        console.log('[DEBUG FORM MAP] Modo Creación. No se pone marcador inicial automático.');
      }  
      setTimeout(() => {
        if (this.mapa) { 
          this.mapa.invalidateSize(); 
          console.log('[DEBUG FORM MAP] Mapa inicializado e invalidateSize llamado.'); 
          this.isLoadingMap = false; 
          this.mapInitError = null; 
        } else {
          console.warn('[DEBUG FORM MAP] Mapa es null después de intentar inicializar y llamar a invalidateSize.');
          this.mapInitError = 'El mapa no se inicializó correctamente.'; 
          this.isLoadingMap = false;
        } 
        this.cdr.detectChanges(); 
      }, 200); 
    } catch (error: any) {
      console.error('[DEBUG FORM MAP] ERROR FATAL al inicializar el mapa', error);
      this.mensaje = 'Error al inicializar el mapa.'; 
      this.mapInitError = `Error al inicializar el mapa: ${error.message || 'Desconocido'}`; 
      this.isLoadingMap = false;
      this.limpiarMapa(); 
      this.cdr.detectChanges(); 
    }
  }

  private manejarClickMapa(evento: L.LeafletMouseEvent): void {
    console.log('[DEBUG FORM MAP] Click en mapa. Coordenadas:', evento.latlng); 
    if (!isPlatformBrowser(this.platformId) || !this.mapa || !this.iconoAvistamientoPersonalizado) {
      console.warn('[DEBUG FORM MAP] Mapa, icono, o navegador no disponible al hacer click.');
      return;
    }

    const latlng = evento.latlng;
    this.avistamientoFormData.ubicacion = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    this.avistamientoFormData.coordenadas = this.avistamientoFormData.ubicacion; 
    console.log('[DEBUG FORM] Coordenadas seleccionadas y asignadas:', this.avistamientoFormData.ubicacion);
    this.actualizarMarcadorMapa([latlng.lat, latlng.lng]); 
    this.cdr.detectChanges();
  }


  private actualizarMarcadorMapa(coords: [number, number]): void {
    console.log('[DEBUG FORM MAP] Actualizando marcador en mapa con coords:', coords); 
    if (!isPlatformBrowser(this.platformId) || !this.mapa || !this.iconoAvistamientoPersonalizado) {
      console.warn('[DEBUG FORM MAP] Mapa, icono, o navegador no disponible para actualizar marcador.');
      return;
    }
    if (this.marcador) {
      this.mapa.removeLayer(this.marcador);
      console.log('[DEBUG FORM MAP] Marcador existente removido.');
    }
    this.marcador = L.marker(coords, { icon: this.iconoAvistamientoPersonalizado }).addTo(this.mapa);
    console.log('[DEBUG FORM MAP] Marcador actualizado/añadido.'); 
  }

   private limpiarMapa(): void {
    console.log('[DEBUG FORM MAP] Iniciando limpieza del mapa.'); 
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('[DEBUG FORM MAP] No en navegador, omitiendo limpieza de mapa.');
      return;
    }
    if (this.marcador && this.mapa) {
      this.mapa.removeLayer(this.marcador);
      this.marcador = null; 
      console.log('[DEBUG FORM MAP] Marcador removido.');
    }
    if (this.mapa) {
      this.mapa.off(); 
      this.mapa.remove(); 
      this.mapa = null; 
      console.log('[DEBUG FORM MAP] Instancia de mapa limpiada.');
    } else {
      console.log('[DEBUG FORM MAP] No hay instancia de mapa para limpiar.');
    }
    this.mapInitError = null; 
    this.isLoadingMap = false; 
    this.cdr.detectChanges(); 
   }

   private parsearCoords(ubicacion: string | undefined | null): [number, number] | null {
    if (!ubicacion) {
      return null;
    }
    const partes = ubicacion.split(',').map(part => parseFloat(part.trim()));
    if (partes.length === 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
      return [partes[0], partes[1]];
    }
    console.warn('[DEBUG FORM] Formato de coordenadas no válido para parsear:', ubicacion);
    return null;
  }
  
  cargarReportes(): void {
    console.log('[FORM] Cargando reportes...');
    this.reportesService.obtenerReportes().subscribe({
      next: (data: any[]) => { 
        this.reportes = data
            .map(item => ({
              id: item.id ?? item.idDesaparecido, 
              nombre: item.nombre
            })).filter(item => item.id !== null && item.id !== undefined);
        console.log('[FORM] Reportes cargados para select:', this.reportes.length, 'elementos.');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('[FORM] Error al cargar reportes', error);
        this.mensaje = 'Error al cargar los reportes disponibles.'; 
        this.cdr.detectChanges(); 
      }
    });
  }

  onPersonaDesaparecidaChange(selectedId: number | string | null): void {
    console.log('[DEBUG FORM] ID de persona desaparecida seleccionado en select (onPersonaDesaparecidaChange):', selectedId, typeof selectedId);
    if (!this.avistamientoFormData.personaDesaparecida) {
      this.avistamientoFormData.personaDesaparecida = { idDesaparecido: null, nombre: '' };
      console.log('[DEBUG FORM] Inicializando avistamientoFormData.personaDesaparecida.');
    }
    let numericSelectedId: number | null = null;
    if (selectedId !== null) {
      numericSelectedId = typeof selectedId === 'string' ? parseInt(selectedId, 10) : selectedId;
      if (isNaN(numericSelectedId)) {
        console.error('[DEBUG FORM] selectedId no es un número válido después de parsear:', selectedId);
        numericSelectedId = null; 
        this.selectedIdDesaparecido = null;
      }
    }
    this.avistamientoFormData.personaDesaparecida.idDesaparecido = numericSelectedId;
    console.log('[DEBUG FORM] Establecido avistamientoFormData.personaDesaparecida.idDesaparecido a:', this.avistamientoFormData.personaDesaparecida.idDesaparecido);
    const reporteSeleccionado = this.reportes.find(r => r.id === numericSelectedId);
    if (reporteSeleccionado) {
      this.avistamientoFormData.personaDesaparecida.nombre = reporteSeleccionado.nombre;
      console.log('[DEBUG FORM] Nombre de persona desaparecida encontrado y asignado:', reporteSeleccionado.nombre);
    } else {
      console.warn('[DEBUG FORM] Reporte no encontrado en la lista para el ID:', numericSelectedId, '. Nombre no asignado/reseteado.');
      this.avistamientoFormData.personaDesaparecida.nombre = ''; // Resetear el nombre si no se encuentra o es null
    }
    console.log('[DEBUG FORM] Estado final de avistamientoFormData.personaDesaparecida:', JSON.parse(JSON.stringify(this.avistamientoFormData.personaDesaparecida)));
    this.cdr.detectChanges(); // Forzar detección de cambios para que la UI se actualice (ej: mensajes de error si el select es requerido y es null)
  }

  onSubmit(): void {
    console.log('[FORM] Botón Submit clickeado.');
    console.log('[DEBUG FORM] onSubmit: selectedIdDesaparecido ANTES VALIDACIÓN =', this.selectedIdDesaparecido);
    console.log('[DEBUG FORM] onSubmit: avistamientoFormData.personaDesaparecida ANTES VALIDACIÓN =', JSON.parse(JSON.stringify(this.avistamientoFormData.personaDesaparecida)));
    console.log('[DEBUG FORM] onSubmit: avistamientoFormData.ubicacion ANTES VALIDACIÓN =', this.avistamientoFormData.ubicacion);
    console.log('[DEBUG FORM] onSubmit: avistamientoFormData.fecha ANTES VALIDACIÓN =', this.avistamientoFormData.fecha); 
    if (this.avistamientoForm && !this.avistamientoForm.form.valid) {
      this.mensaje = 'Por favor, completa todos los campos requeridos (*).'; 
      console.warn('[FORM] Formulario inválido según Angular form validation.', this.avistamientoForm.form.errors); // Log de detalles de validación
      Object.values(this.avistamientoForm.controls).forEach(control => {
        if (control.enabled && control.validator) {
          control.markAsTouched();
        }
      });
      this.cdr.detectChanges(); 
      return; 
    }
    if (this.selectedIdDesaparecido === null) { 
      this.mensaje = 'Debes seleccionar un Reporte.'; 
      this.isLoading = false; 
      console.warn('[FORM] Validación manual fallida - selectedIdDesaparecido es null.');
      if (this.avistamientoForm?.controls['personaDesaparecidaSelect']) {
        this.avistamientoForm.controls['personaDesaparecidaSelect'].markAsTouched();
      }
      this.cdr.detectChanges(); 
      return; 
    }
    if (!this.avistamientoFormData.personaDesaparecida?.idDesaparecido) {
      this.mensaje = 'Error interno: ID de persona desaparecida no asignado correctamente.'; 
      this.isLoading = false; 
      console.error('[FORM] Error crítico - avistamientoFormData.personaDesaparecida.idDesaparecido no está seteado pese a que selectedIdDesaparecido sí podría estarlo.');
      this.cdr.detectChanges(); 
      return;
    }
    if (!this.avistamientoFormData.ubicacion) {
      this.mensaje = 'Debes seleccionar la Ubicación en el mapa.'; 
      this.isLoading = false; 
      console.warn('[FORM] Validación manual fallida - ubicacion es null/vacío.');
      if (this.avistamientoForm?.controls['lugarDisplay']) {
        this.avistamientoForm.controls['lugarDisplay'].markAsTouched();
      }
      this.cdr.detectChanges(); 
      return; 
    }
    if (!this.avistamientoFormData.fecha) {
      this.mensaje = 'La fecha del avistamiento es obligatoria.';
      this.isLoading = false; 
      console.warn('[FORM] Validación manual fallida - fecha es null/vacío.');
      if (this.avistamientoForm?.controls['fecha']) {
        this.avistamientoForm.controls['fecha'].markAsTouched();
      }
      this.cdr.detectChanges(); 
      return;
    }
    this.isLoading = true;
    const payload: any = { 
      personaDesaparecida: {
        idDesaparecido: this.avistamientoFormData.personaDesaparecida?.idDesaparecido  
      },
      fecha: this.avistamientoFormData.fecha, 
      ubicacion: this.avistamientoFormData.ubicacion, 
      descripcion: this.avistamientoFormData.descripcion || null 
    };
    if (payload.personaDesaparecida && payload.personaDesaparecida.idDesaparecido === null) {
      console.warn('[DEBUG FORM] Payload personaDesaparecida.idDesaparecido es null. Enviando personaDesaparecida: null');
      payload.personaDesaparecida = null; 
    }
    console.log('[FORM] Datos del formulario listos para enviar:', JSON.parse(JSON.stringify(this.avistamientoFormData))); 
    console.log('[FORM] Payload preparado para enviar:', JSON.parse(JSON.stringify(payload)));
    if (this.isEditing && this.avistamientoFormData.idAvistamiento !== undefined) {
      console.log(`[FORM] Modo Edición: ID ${this.avistamientoFormData.idAvistamiento}. Llamando a actualizarAvistamiento.`);
      this.actualizarAvistamiento(this.avistamientoFormData.idAvistamiento as number, payload); 
    } else {
      console.log('[FORM] Modo Creación. Llamando a crearAvistamiento.');
      const emailUsuario = this.usuarioService.getCurrentUserEmail();
      if (!emailUsuario) {
        this.mensaje = 'Debes iniciar sesión para registrar un avistamiento.';
        this.isLoading = false; 
        console.warn('[FORM] Usuario no logueado al intentar crear.');
        this.cdr.detectChanges();
        return; 
      }
      const createPayload = { ...payload, emailUsuario: emailUsuario };
      this.crearAvistamiento(createPayload);
    }
  }
 
  crearAvistamiento(payload: any): void { 
    console.log('[FORM] Payload para CREAR avistamiento enviado a service:', payload);

    this.avistamientosService.crearAvistamiento(payload).subscribe({
      next: (response) => {
        console.log('[FORM] ✅ Avistamiento creado con éxito:', response); // Log de éxito
        this.mensaje = 'Avistamiento registrado con éxito.'; // Mensaje de éxito al usuario
        this.isLoading = false; // Ocultar indicador
        this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje de éxito
        setTimeout(() => {
            this.router.navigate(['/reportes']); // Redirigir a la página de reportes/cards (o a la que sea apropiada)
        }, 2000); // 2 segundos de retraso
      },
      error: (error) => {
        console.error('[FORM] ❌ Error al crear avistamiento:', error); // Log de error
        // Mostrar mensaje de error detallado al usuario si es posible
        this.mensaje = `Error al registrar: ${error.error?.message || error.message || 'Error desconocido'}`;
        this.isLoading = false; // Ocultar indicador
        this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje de error
      }
    });
  }
  
  actualizarAvistamiento(id: number, payload: Partial<Avistamiento>): void { // Acepta el ID del avistamiento y el payload de actualización
    console.log(`[FORM] 📤 Payload para ACTUALIZAR avistamiento ${id} enviado a service:`, payload);

    this.avistamientosService.actualizarAvistamiento(id, payload).subscribe({
      next: (response) => {
        console.log('[FORM] ✅ Avistamiento actualizado con éxito:', response); // Log de éxito
        this.mensaje = 'Avistamiento actualizado con éxito.'; // Mensaje de éxito al usuario
        this.isLoading = false; // Ocultar indicador
         this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje de éxito
        // Redirigir después de un pequeño retraso
        setTimeout(() => {
             this.router.navigate(['/reportes']); // Redirigir a la página de reportes/cards (o a la que sea apropiada)
         }, 2000); // 2 segundos de retraso
      },
      error: (error) => {
        console.error('[FORM] ❌ Error al actualizar avistamiento:', error); // Log de error
         // Mostrar mensaje de error detallado al usuario si es posible
        this.mensaje = `Error al actualizar: ${error.error?.message || error.message || 'Error desconocido'}`;
        this.isLoading = false; // Ocultar indicador
        this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje de error
      }
    });
  }


  
  cancelarEdicion(): void {
    console.log('[FORM] Edición cancelada.'); // Log de cancelación
   
    this.router.navigate(['/reportes']);
  }
  
  resetForm(shouldReinitializeMap: boolean = true): void {
    console.log('[FORM] 🔄 Reseteando formulario...'); // Log de inicio de reset

    
    this.avistamientoFormData = {
      idAvistamiento: undefined, // Asegurarse de que no quede un ID viejo si pasas de editar a crear
      fecha: '',
      ubicacion: '',
      descripcion: '',
      personaDesaparecida: { idDesaparecido: null, nombre: '' }, // Resetear el objeto asociado
      emailUsuario: '', // Resetear (solo se necesita para creación)
      coordenadas: '' // Resetear el input readonly
    };

    this.selectedIdDesaparecido = null;

    
    this.limpiarMapa();

    
    if (shouldReinitializeMap && isPlatformBrowser(this.platformId) && this.mapContainer?.nativeElement) {
       console.log('[DEBUG FORM MAP] Re-inicializando mapa después de reset para modo creación.');
         setTimeout(() => this.inicializarMapa(), 50);
    } else if (shouldReinitializeMap) {
         console.warn('[DEBUG FORM MAP] No se pudo re-inicializar mapa después de reset (no navegador o contenedor no disponible).');
    }


    this.mensaje = ''; // Limpiar mensajes de éxito/error
    this.isLoading = false; // Asegurarse de que el indicador de carga está desactivado
    this.mapInitError = null; // Limpiar error de inicialización de mapa

    
    if (this.avistamientoForm) {
        console.log('[DEBUG FORM] Llamando a avistamientoForm.resetForm().');
        
        this.avistamientoForm.resetForm(this.avistamientoFormData);
        
        this.selectedIdDesaparecido = null; 

    } else {
        console.warn('[DEBUG FORM] avistamientoForm es null, no se puede llamar a resetForm().');
       
    }

    this.cdr.detectChanges();
    console.log('[FORM] ✅ Formulario reseteado.');
  }
  
  


}