import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
// --- Importar FormsModule y NgForm ---
import { FormsModule, NgForm } from '@angular/forms';
// -----------------------------------
// --- Importar AvistamientoService y la interfaz Avistamiento ---
import { AvistamientoService, Avistamiento } from '../../services/avistamiento.service';
// ---------------------------------------------------------------
import { ReportesService } from '../../services/reportes.service';
// --- Importar ActivatedRoute y Router ---
import { ActivatedRoute, Router } from '@angular/router';
// -------------------------------------
// --- Importar Subscription (ya estaba, asegurar que esté) ---
import { Subscription } from 'rxjs';
// -----------------------------------------------------------
// --- Importar FeatureFlagsService (si lo usas) ---
import { FeatureFlagsService } from '../../services/feature-flags.service'; // Asegúrate de que este servicio existe
// --------------------------------------------------
import * as L from 'leaflet';
// --- Importar UsuarioService si lo usas para el email ---
import { UsuarioService } from '../../services/usuario.service'; // Asegúrate de que este servicio existe
// ------------------------------------------------------


// Interfaz local para los reportes en el select (puede ser más simple que la del ReportesService)
interface DesaparecidoOficial {
  id: number; // El valor que usas en el select option [value]
  nombre: string;
}

// La interfaz Avistamiento se importa desde AvistamientoService.ts


@Component({
  selector: 'app-form-avistamientos',
  standalone: true, // Mantener si es standalone
  imports: [CommonModule, FormsModule], // Asegurar que FormsModule está aquí
  templateUrl: './form-avistamientos.component.html',
  styleUrls: ['./form-avistamientos.component.scss']
})
// --- Implementar OnDestroy y AfterViewInit ---
export class FormAvistamientosComponent implements OnInit, OnDestroy, AfterViewInit {
  // @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef; // Remover { static: true } si el div del mapa está dentro de un *ngIf
  @ViewChild('mapContainer') mapContainer!: ElementRef; // Si el div del mapa NO está en un *ngIf inicial
  @ViewChild('avistamientoForm') avistamientoForm!: NgForm; // Para acceder al estado del formulario Angular


  // --- Reemplazar nuevoAvistamiento por avistamientoFormData usando la interfaz Avistamiento ---
  // Inicializar avistamientoFormData para evitar errores de undefined
  // Usar la interfaz Avistamiento importada
  public avistamientoFormData: Partial<Avistamiento> & { coordenadas?: string } = {
    idAvistamiento: undefined, // o null, dependiendo si backend usa null o no para new entries
    fecha: '',
    ubicacion: '', // Se llena al seleccionar en el mapa
    descripcion: '',
    // Inicializar personaDesaparecida como un objeto con valores nulos/vacíos
    personaDesaparecida: { idDesaparecido: null, nombre: '' },
    emailUsuario: '', // Se llenará al guardar (para creación) o se cargará (para edición)
    coordenadas: '' // Para el input readonly que muestra la ubicación "Lat, Lng"
  };
  // ----------------------------------------------------------------------------------------


  reportes: DesaparecidoOficial[] = []; // Usar la interfaz DesaparecidoOficial
  mensaje: string = ''; // Mensajes de éxito o error
  isLoading = false; // Indicador de carga al enviar el formulario
  isEditing = false; // --- Bandera para saber si estamos en modo edición ---


  // --- Variables relacionadas con el mapa ---
  public mapa: any; // L.Map | undefined; // Si usas tipado estricto L.Map | undefined
  private marcador: L.Marker | null = null;
  // --- Crear un icono personalizado para el marcador del mapa ---
  private iconoAvistamientoPersonalizado: L.Icon | null = null; // L.Icon | undefined; // Si usas tipado estricto
  // ------------------------------------------------------------
  isLoadingMap = false; // Nuevo: Indicador de carga del mapa
  mapInitError: string | null = null; // Nuevo: Mensaje de error de inicialización del mapa
  // ------------------------------------------

  // --- Suscripciones ---
  private paramMapSubscription: Subscription | undefined; // Suscripción a los parámetros de ruta
  // private avistamientoSubscription: Subscription | undefined; // Esta suscripción en tu código base parece no ser necesaria para el form mismo, solo para otros componentes (cards, foro). La elimino para el form.
  // ---------------------

  selectedIdDesaparecido: number | null = null; // Para el ngModel del select de reporte


  constructor(
    // --- Inyectar los servicios necesarios ---
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService, // Si lo usas
    private usuarioService: UsuarioService, // Si lo usas para obtener email
    // ---------------------------------------
    // --- Inyectar ActivatedRoute y Router ---
    private route: ActivatedRoute, // Para leer parámetros de la ruta
    public router: Router, // Para navegar
    // --------------------------------------
    @Inject(PLATFORM_ID) private platformId: Object,
    // --- Inyectar ChangeDetectorRef ---
    private cdr: ChangeDetectorRef // Para forzar detección de cambios si es necesario (ej: después de actualizaciones asíncronas)
    // ----------------------------------
  ) {
    console.log('[FORM] Componente construido.');
  }

  ngOnInit(): void {
    console.log('[FORM] ngOnInit iniciado.');
    this.cargarReportes(); // Cargar la lista de reportes desaparecidos para el select

    if (isPlatformBrowser(this.platformId)) {
        console.log('[FORM] 🌐 Navegador detectado. Suscribiéndose a paramMap...');
        // Suscribirse a los cambios en los parámetros de la URL
        // Esto es crucial para detectar si se navegó a `/avistamientos/form` (crear) o `/avistamientos/form/:id` (editar)
        this.paramMapSubscription = this.route.paramMap.subscribe(params => {
            console.log('[DEBUG FORM] 🗺️ paramMap subscription triggered. Raw params:', params);
            const avistamientoIdParam = params.get('id');
            // Convertir el ID de la URL a número. Si no hay ID, será null.
            const avistamientoId = avistamientoIdParam ? +avistamientoIdParam : null;

            console.log('[DEBUG FORM] 🆔 Parsed ID from URL:', avistamientoId);

            // Lógica para determinar si estamos en modo edición o creación
            // Si hay un ID en la URL (y es un número válido), estamos en modo edición.
            // Si no hay ID, estamos en modo creación.

            // Scenario 1: Navegando AL modo edición (ej: click en Editar en el foro)
            // Esto ocurre si hay un ID en la URL *y* el componente no está ya mostrando ese mismo ID en modo edición.
            if (avistamientoId !== null && !isNaN(avistamientoId) && (this.avistamientoFormData.idAvistamiento !== avistamientoId || !this.isEditing)) {
                 console.log(`[DEBUG FORM] ✏️ Entering/Transitioning to Edit mode for ID: ${avistamientoId}`);
                 this.resetForm(false); // Reset form state but don't immediately re-init map
                 this.avistamientoFormData.idAvistamiento = avistamientoId; // Guardar el ID para referencia
                 this.isEditing = true; // Establecer modo edición
                 this.cargarAvistamientoParaEdicion(this.avistamientoFormData.idAvistamiento); // Cargar los datos del avistamiento

            }
            // Scenario 2: Navegando AL modo creación (ej: click en "Reportar avistamiento")
            // Esto ocurre si NO hay ID en la URL *y* el componente no está ya mostrando un formulario vacío en modo creación.
            // (Por ejemplo, si vienes de editar y navegas a /avistamientos/form sin ID).
             else if (!avistamientoId && (this.isEditing || this.avistamientoFormData.idAvistamiento !== undefined)) {
                 console.log('[DEBUG FORM] ✨ Entering/Transitioning to Create mode.');
                 this.resetForm(true); // Reset form state AND prepare for map re-init
                 this.isEditing = false; // Asegurarse de que isEditing es false
             }
            // Scenario 3: Ya en el modo correcto con los datos correctos (no se necesita hacer nada)
            // Esto puede pasar al inicializar si no hay ID, o si paramMap se dispara pero el ID y el modo no cambiaron.
            else {
                console.log('[DEBUG FORM] ParamMap triggered, but no significant mode change or data reload needed.');
                // Asegurarse de que el mapa se inicialice si aún no lo ha hecho (ej. AfterViewInit no ha disparado todavía)
                 if (!this.mapa && this.mapContainer?.nativeElement) {
                      console.log('[DEBUG FORM] Map not initialized yet, calling inicializarMapa from paramMap else branch.');
                       // Pequeño retraso para dar tiempo al DOM si es necesario
                       setTimeout(() => this.inicializarMapa(), 50);
                 }
            }

            // Después de que la lógica de paramMap procesa, forzar una detección de cambios
            // Esto ayuda a actualizar la UI (ej: el título, el botón de submit)
            this.cdr.detectChanges();

        });
    } else {
      console.warn('[FORM] 🚫 No se ejecuta en navegador (SSR)');
    }
  }

  ngAfterViewInit(): void {
    console.log('[FORM] ngAfterViewInit iniciado.');
     // Inicializa el mapa aquí. Si estamos en modo edición, los datos se cargarán después,
     // y el marcador/centro del mapa se establecerán en el `cargarAvistamientoParaEdicion` subscribe's `next`.
     // Añadimos un pequeño retraso para asegurar que el elemento del DOM (`mapContainer`) esté completamente renderizado,
     // lo cual es especialmente importante si el componente se agregó dinámicamente o dentro de un bloque condicional (`*ngIf`).
    if (isPlatformBrowser(this.platformId) && this.mapContainer?.nativeElement) {
      console.log('[FORM] Contenedor del mapa disponible. Inicializando mapa con un pequeño retraso...');
      // Usar setTimeout para esperar un ciclo de detección de cambios
      setTimeout(() => {
          this.inicializarMapa();
           // Si ya estamos en modo edición y los datos se cargaron ANTES de que AfterViewInit disparara,
           // podríamos tener la ubicación en `avistamientoFormData` pero el mapa aún no existía.
           // En ese caso, ponemos el marcador y centramos AHORA que el mapa ya está inicializado.
           // La lógica en `inicializarMapa` ya intenta hacer esto si `this.isEditing` es true,
           // pero esta es una doble comprobación.
          if (this.isEditing && this.avistamientoFormData.ubicacion && this.mapa && this.marcador === null) {
               // Usar el parsearCoords del servicio si lo moviste allí, o tu propio método local
               const coords = this.parsearCoords(this.avistamientoFormData.ubicacion); // Usar el método parsearCoords del componente
                if(coords){
                   console.log('[DEBUG FORM MAP] Setting initial marker/view after ngAfterViewInit map init (edit mode).');
                   this.actualizarMarcadorMapa(coords);
                   // Centrar el mapa en las coordenadas del avistamiento
                   this.mapa.setView(coords, this.mapa.getZoom() > 6 ? this.mapa.getZoom() : 13); // Mantener zoom si es alto, si no, usar 13
                   this.mapa.invalidateSize(); // Importante si el mapa estaba oculto
                } else {
                     console.warn('[DEBUG FORM MAP] Ubicación cargada no válida para setear marcador/vista en ngAfterViewInit:', this.avistamientoFormData.ubicacion);
                }
          }
           // Forzar detección de cambios para asegurar que la UI se actualiza después de que el estado del mapa cambia (isLoadingMap, mapInitError)
           this.cdr.detectChanges();
      }, 100); // Un pequeño retraso (100ms) a menudo es suficiente

    } else if (!this.mapContainer?.nativeElement) {
        // Si el contenedor del mapa no está disponible, registrar un error y actualizar el estado
        console.error('[FORM] ❌ ERROR - mapContainer.nativeElement es null en ngAfterViewInit. No se puede inicializar el mapa.');
         this.mapInitError = 'El contenedor del mapa no está disponible.';
         this.cdr.detectChanges(); // Forzar detección para mostrar el error en el template
    }
  }

  // --- Implementar ngOnDestroy para limpiar suscripciones y mapa ---
  ngOnDestroy(): void {
    console.log('[FORM] 💤 ngOnDestroy iniciado.');
    this.limpiarMapa(); // Limpiar el mapa al destruir el componente

    if (this.paramMapSubscription) {
        console.log('[FORM] 🛑 Cancelando suscripción paramMap');
        this.paramMapSubscription.unsubscribe();
    }
     /* La suscripción a avistamientoCreado$ / avistamientoCambiado$ no es necesaria en el form mismo.
        La lógica de actualización de lista se hace en cards y foro.
     if (this.avistamientoSubscription) {
       console.log('Form-Avistamiento: Cancelando suscripción a avistamientoCreado$');
       this.avistamientoSubscription.unsubscribe();
     }
     */
     console.log('[FORM] ngOnDestroy finalizado.');
  }
  // -----------------------------------------------------------------


  // --- Método para cargar los datos de un avistamiento específico para edición ---
  private cargarAvistamientoParaEdicion(id: number): void {
    this.isLoading = true; // Mostrar indicador de carga
    this.mensaje = ''; // Limpiar mensajes previos
    this.mapInitError = null; // Limpiar error de mapa previo

    console.log(`[DEBUG FORM] ⏳ Cargando datos de avistamiento con ID: ${id}`); // Log de inicio de carga

    // --- USAR el método del servicio para obtener un avistamiento por ID ---
    this.avistamientosService.obtenerAvistamientoPorId(id).subscribe({
    // ---------------------------------------------------------------------
      next: (avistamiento: Avistamiento) => {
        console.log('[DEBUG FORM] ✅ Datos de avistamiento para edición cargados:', avistamiento); // Log de éxito

        // Mapear los datos recibidos a avistamientoFormData
        // Usar Partial<Avistamiento> permite asignar solo las propiedades que vienen
        this.avistamientoFormData.idAvistamiento = avistamiento.idAvistamiento;
        this.avistamientoFormData.descripcion = avistamiento.descripcion;
        // El emailUsuario no es editable, pero lo guardamos si viene para referencia
        this.avistamientoFormData.emailUsuario = avistamiento.emailUsuario;


        // Formatear la fecha a 'YYYY-MM-DD' para el input type="date"
        // La fecha del backend puede ser string o Date, asegurar manejo
        if (avistamiento.fecha) {
             try {
                // Intenta parsear como ISO string o Date object
                 const dateObj = new Date(avistamiento.fecha);
                 if (!isNaN(dateObj.getTime())) { // Verificar si la fecha es válida
                     // Formatea a YYYY-MM-DD
                     this.avistamientoFormData.fecha = dateObj.toISOString().split('T')[0];
                     console.log('[DEBUG FORM] Fecha formateada:', this.avistamientoFormData.fecha);
                 } else {
                     console.warn('[DEBUG FORM] Fecha del backend inválida:', avistamiento.fecha, '. Reseteando fecha.');
                     this.avistamientoFormData.fecha = ''; // Fecha inválida
                 }
             } catch (e) {
                  console.error('[DEBUG FORM] Error al parsear fecha del backend:', avistamiento.fecha, e);
                  this.avistamientoFormData.fecha = '';
             }
        } else {
             this.avistamientoFormData.fecha = ''; // Fecha nula/undefined
        }


        // Asignar ubicación y coordenadas (para mostrar en el input readonly)
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
            this.selectedIdDesaparecido = null; // Asegurarse de que el select esté vacío
           
            this.avistamientoFormData.personaDesaparecida = { idDesaparecido: null, nombre: '' };
            console.warn('[DEBUG FORM] No se encontró ID de persona desaparecida en los datos cargados. selectedIdDesaparecido = null.');
        }
        this.onPersonaDesaparecidaChange(this.selectedIdDesaparecido);


       
        if (this.mapa && this.avistamientoFormData.ubicacion) {
             const coords = this.parsearCoords(this.avistamientoFormData.ubicacion); // Usar el método parsearCoords del componente
             if(coords){
                console.log('[DEBUG FORM MAP] 📍 Actualizando marcador en mapa con coords cargadas (desde subscribe):', coords);
                this.actualizarMarcadorMapa(coords);
                
                this.mapa.setView(coords, this.mapa.getZoom() > 6 ? this.mapa.getZoom() : 13); // Mantener zoom si es alto, si no, usar 13
                 this.mapa.invalidateSize(); 
                 console.log('[DEBUG FORM MAP] Mapa centrado y tamaño invalidado.');
             } else {
                  console.warn('[DEBUG FORM MAP] Ubicación cargada no válida para el mapa (desde subscribe):', this.avistamientoFormData.ubicacion);
                  this.mapInitError = 'Las coordenadas cargadas para la edición no son válidas.'; // Mostrar error en UI del mapa
             }
        } else if (this.avistamientoFormData.ubicacion) {
             console.log('[DEBUG FORM MAP] 🗺️ Mapa aún no inicializado al cargar datos. Se intentará poner marcador/centrar en inicializarMapa o AfterViewInit.');
             
        } else {
             console.log('[DEBUG FORM MAP] No hay ubicación en los datos cargados, no se pondrá marcador inicial.');
        }


        this.isLoading = false; // Ocultar indicador de carga
        
        this.cdr.detectChanges();
        console.log('[DEBUG FORM] ✅ Datos de edición aplicados al formulario.');
       
         if (this.avistamientoForm) { this.avistamientoForm.form.markAsPristine(); }
      },
      error: (error) => {
        console.error('[DEBUG FORM] ❌ Error al cargar avistamiento para edición:', error); // Log de error
        // Mostrar mensaje de error al usuario
        this.mensaje = `Error al cargar: ${error.status === 404 ? 'Avistamiento no encontrado.' : error.status === 403 ? 'No tienes permiso para editar este avistamiento.' : (error.message || 'Error desconocido')}`;
        this.isLoading = false; // Ocultar indicador de carga
         // Mostrar error en el contenedor del mapa si aplica
         this.mapInitError = 'No se pudo cargar el avistamiento para mostrar la ubicación.';
        this.cdr.detectChanges(); // Forzar detección de cambios para mostrar el error

       
        this.resetForm(true); // Resetear el form y mapa en caso de error de carga
        this.router.navigate(['/reportes']); // Redirigir a la lista si falla la carga
      },
    });
  }


  private inicializarMapa(): void {
    console.log('[DEBUG FORM MAP] 🗺️ Iniciando inicialización del mapa.'); // Log de inicio
    if (!isPlatformBrowser(this.platformId)) {
        console.warn('[DEBUG FORM MAP] 🚫 No se puede inicializar mapa: No es navegador.');
        this.mapInitError = 'Funcionalidad de mapa no disponible.'; // Estado de error
        this.isLoadingMap = false; // Indicador off
         this.cdr.detectChanges();
        return;
    }
    if (!this.mapContainer?.nativeElement) {
        console.error('[DEBUG FORM MAP] ❌ ERROR - mapContainer.nativeElement es null. No se puede inicializar el mapa.'); // Log de error
         this.mapInitError = 'Error interno: Contenedor del mapa no encontrado.'; // Estado de error
         this.isLoadingMap = false; // Indicador off
         this.cdr.detectChanges();
        return;
    }
     // Si el mapa ya existe (de un intento anterior o un reset parcial), limpiarlo antes de inicializar de nuevo
     if (this.mapa) {
         console.log('[DEBUG FORM MAP] Mapa ya inicializado. Limpiando instancia existente.');
         this.limpiarMapa(); // Llamar a la lógica de limpieza
     }

    this.isLoadingMap = true; // Indicar que el mapa está cargando
    this.mapInitError = null; // Limpiar error previo

    const container = this.mapContainer.nativeElement;
   
     container.style.height = '400px'; // O alguna altura predefinida
     container.style.width = '100%'; // O algún ancho predefinido
     container.style.margin = '1rem 0'; // Reaplicar estilos del template
     container.style.borderRadius = '8px';
     container.style.border = '1px solid #ddd';
    console.log('[DEBUG FORM MAP] Dimensiones y estilos del contenedor del mapa aseguradas.');

    try {
        
        if (!this.iconoAvistamientoPersonalizado) {
             this.iconoAvistamientoPersonalizado = L.icon({
               iconUrl: 'assets/images/marker-icon.png',
               iconRetinaUrl: 'assets/images/marker-icon-2x.png', // Si tienes versión retina
               iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
               shadowUrl: 'assets/images/marker-shadow.png',
               shadowSize: [41, 41], shadowAnchor: [12, 41]
             });
             console.log('[DEBUG FORM MAP] Icono personalizado de marcador creado.');
        }


       
        const initialCenter: [number, number] = (this.isEditing && this.avistamientoFormData.ubicacion)
            ? this.parsearCoords(this.avistamientoFormData.ubicacion) || [-17.3935, -66.1570] // Fallback a Cochabamba si coords cargadas son inválidas
            : [-17.3935, -66.1570]; // Coordenadas por defecto (ej: Cochabamba)

        this.mapa = L.map(container, {
            center: initialCenter,
            zoom: 13,
            zoomControl: true, // Mostrar control de zoom
        });
         console.log('[DEBUG FORM MAP] Instancia de mapa creada con centro inicial:', initialCenter);


        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 3,
          noWrap: false // Permite que el mapa se repita horizontalmente
        }).addTo(this.mapa);
        console.log('[DEBUG FORM MAP] Capa de OpenStreetMap añadida.');


        this.mapa.on('click', (e: L.LeafletMouseEvent) => this.manejarClickMapa(e));
        console.log('[DEBUG FORM MAP] Event listener para click en mapa añadido.');


         if (this.isEditing && this.avistamientoFormData.ubicacion) {
             const coords = this.parsearCoords(this.avistamientoFormData.ubicacion); // Usar el método parsearCoords del componente
              if(coords){
                 console.log('[DEBUG FORM MAP] 📍 Poniendo marcador inicial (edición) en inicializarMapa:', coords);
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
                this.mapa.invalidateSize(); // Asegura que el mapa se renderice correctamente dentro del div
                console.log('[DEBUG FORM MAP] ✅ Mapa inicializado e invalidateSize llamado.'); // Log de éxito
                this.isLoadingMap = false; // Mapa cargado
                this.mapInitError = null; // Limpiar error si tuvo éxito
             } else {
                  console.warn('[DEBUG FORM MAP] Mapa es null después de intentar inicializar y llamar a invalidateSize.');
                   this.mapInitError = 'El mapa no se inicializó correctamente.'; // Fallback de error
                   this.isLoadingMap = false;
             }
             this.cdr.detectChanges(); 
        }, 200); 

    } catch (error: any) {
        // Capturar cualquier error durante la inicialización de Leaflet
        console.error('[DEBUG FORM MAP] ❌ ERROR FATAL al inicializar el mapa', error); // Log de error
        this.mensaje = 'Error al inicializar el mapa.'; // Mensaje al usuario en el formulario principal
        this.mapInitError = `Error al inicializar el mapa: ${error.message || 'Desconocido'}`; // Mensaje en el contenedor del mapa
        this.isLoadingMap = false; // Indicador off
        this.limpiarMapa(); // Intentar limpiar en caso de error parcial
        this.cdr.detectChanges(); // Forzar detección para mostrar errores
    }
  }
 
  private manejarClickMapa(evento: L.LeafletMouseEvent): void {
    console.log('[DEBUG FORM MAP] 🖱️ Click en mapa. Coordenadas:', evento.latlng); // Log de coordenadas
    // Verificar si estamos en un navegador y si el mapa y el icono existen
    if (!isPlatformBrowser(this.platformId) || !this.mapa || !this.iconoAvistamientoPersonalizado) {
        console.warn('[DEBUG FORM MAP] Mapa, icono, o navegador no disponible al hacer click.');
        return;
    }

    const latlng = evento.latlng;
    this.avistamientoFormData.ubicacion = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    this.avistamientoFormData.coordenadas = this.avistamientoFormData.ubicacion; // Actualiza el input readonly para mostrar las coords
    console.log('[DEBUG FORM] Coordenadas seleccionadas y asignadas:', this.avistamientoFormData.ubicacion);

    this.actualizarMarcadorMapa([latlng.lat, latlng.lng]); // Llamar al método para actualizar el marcador

    
    this.cdr.detectChanges();
  }


  private actualizarMarcadorMapa(coords: [number, number]): void {
      console.log('[DEBUG FORM MAP] 📌 Actualizando marcador en mapa con coords:', coords); // Log de coords
      if (!isPlatformBrowser(this.platformId) || !this.mapa || !this.iconoAvistamientoPersonalizado) {
          console.warn('[DEBUG FORM MAP] Mapa, icono, o navegador no disponible para actualizar marcador.');
          return;
      }

      if (this.marcador) {
        this.mapa.removeLayer(this.marcador);
        console.log('[DEBUG FORM MAP] Marcador existente removido.');
      }

      this.marcador = L.marker(coords, { icon: this.iconoAvistamientoPersonalizado }).addTo(this.mapa);
      console.log('[DEBUG FORM MAP] ✅ Marcador actualizado/añadido.');
     
  }


   private limpiarMapa(): void {
    console.log('[DEBUG FORM MAP] 🧹 Iniciando limpieza del mapa.'); // Log de inicio
    if (!isPlatformBrowser(this.platformId)) {
         console.warn('[DEBUG FORM MAP] No en navegador, omitiendo limpieza de mapa.');
         return;
    }

    if (this.marcador && this.mapa) {
      this.mapa.removeLayer(this.marcador);
      this.marcador = null; // Establecer a null
      console.log('[DEBUG FORM MAP] Marcador removido.');
    }

    
    if (this.mapa) {
      this.mapa.off(); // Remover todos los eventos asociados al mapa
      this.mapa.remove(); // Remover la instancia del mapa del DOM y liberar recursos
      this.mapa = null; // Establecer a null para liberar memoria
      console.log('[DEBUG FORM MAP] ✅ Instancia de mapa limpiada.');
    } else {
        console.log('[DEBUG FORM MAP] No hay instancia de mapa para limpiar.');
    }
     this.mapInitError = null; // Limpiar cualquier error de inicialización de mapa
     this.isLoadingMap = false; // Asegurarse de que el indicador de carga del mapa esté desactivado
     this.cdr.detectChanges(); // Forzar detección para actualizar la UI si el mapa se removió
   }

   private parsearCoords(ubicacion: string | undefined | null): [number, number] | null {
        if (!ubicacion) {
            //console.warn('[DEBUG FORM] Intento de parsear coords nulas/vacías.');
            return null;
        }
        const partes = ubicacion.split(',').map(part => parseFloat(part.trim()));
        if (partes.length === 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
            //console.log('[DEBUG FORM] Coords parseadas con éxito:', partes);
            return [partes[0], partes[1]];
        }
        console.warn('[DEBUG FORM] Formato de coordenadas no válido para parsear:', ubicacion);
        return null;
    }
   // -------------------------------------------------------------------------------------------


  // --- Método para cargar la lista de reportes desaparecidos para el select ---
  cargarReportes(): void {
    console.log('[FORM] ⏳ Cargando reportes...');
    // Usar ReportesService para obtener los reportes
    this.reportesService.obtenerReportes().subscribe({
      next: (data: any[]) => { // Asumiendo que data es un array de objetos reporte
        
        this.reportes = data
            
            .map(item => ({
                // Asegúrate de mapear el ID correcto ('id' o 'idDesaparecido' según el backend)
              id: item.id ?? item.idDesaparecido, // Usa 'id' si item.id existe, si no, usa item.idDesaparecido
              nombre: item.nombre
            })).filter(item => item.id !== null && item.id !== undefined); // Filtrar items sin ID válido

        console.log('[FORM] ✅ Reportes cargados para select:', this.reportes.length, 'elementos.');
        // console.log('[DEBUG FORM] Reportes cargados (primeros 5):', this.reportes.slice(0, 5)); // Log parcial si son muchos

        // Forzar detección de cambios para actualizar el select en la UI
        this.cdr.detectChanges();

      

      },
      error: (error) => {
        console.error('[FORM] ❌ Error al cargar reportes', error);
        this.mensaje = 'Error al cargar los reportes disponibles.'; // Mostrar mensaje de error
        this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje
      }
    });
  }

  
  onPersonaDesaparecidaChange(selectedId: number | string | null): void {
    console.log('[DEBUG FORM] 👥 ID de persona desaparecida seleccionado en select (onPersonaDesaparecidaChange):', selectedId, typeof selectedId);

    // Asegurarse de que personaDesaparecida en formData sea un objeto válido antes de intentar acceder a sus propiedades
    if (!this.avistamientoFormData.personaDesaparecida) {
        this.avistamientoFormData.personaDesaparecida = { idDesaparecido: null, nombre: '' };
        console.log('[DEBUG FORM] Inicializando avistamientoFormData.personaDesaparecida.');
    }

    // Convertir el valor seleccionado del select a número. Si es null, se mantiene null.
    let numericSelectedId: number | null = null;
    if (selectedId !== null) {
        // Intentar parsear a entero. Base 10.
        numericSelectedId = typeof selectedId === 'string' ? parseInt(selectedId, 10) : selectedId;
        // Validar si el resultado del parseo es NaN
        if (isNaN(numericSelectedId)) {
             console.error('[DEBUG FORM] ❌ selectedId no es un número válido después de parsear:', selectedId);
             numericSelectedId = null; // Si no es válido, establecerlo a null
             this.selectedIdDesaparecido = null; // Asegurar que el ngModel del select refleje el estado nulo para entrada inválida
        }
    }

   
    this.avistamientoFormData.personaDesaparecida.idDesaparecido = numericSelectedId;
    console.log('[DEBUG FORM] Establecido avistamientoFormData.personaDesaparecida.idDesaparecido a:', this.avistamientoFormData.personaDesaparecida.idDesaparecido);
    // -------------------------------------


    
    const reporteSeleccionado = this.reportes.find(r => r.id === numericSelectedId);

    if (reporteSeleccionado) {
      
      this.avistamientoFormData.personaDesaparecida.nombre = reporteSeleccionado.nombre;
      console.log('[DEBUG FORM] ✅ Nombre de persona desaparecida encontrado y asignado:', reporteSeleccionado.nombre);
    } else {
      // Si el reporte seleccionado no se encuentra en la lista (ej: null seleccionado, ID no válido, lista no cargada)
       console.warn('[DEBUG FORM] ⚠️ Reporte no encontrado en la lista para el ID:', numericSelectedId, '. Nombre no asignado/reseteado.');
       this.avistamientoFormData.personaDesaparecida.nombre = ''; // Resetear el nombre si no se encuentra o es null
    }

    console.log('[DEBUG FORM] Estado final de avistamientoFormData.personaDesaparecida:', JSON.parse(JSON.stringify(this.avistamientoFormData.personaDesaparecida)));
    this.cdr.detectChanges(); // Forzar detección de cambios para que la UI se actualice (ej: mensajes de error si el select es requerido y es null)
}
// ---------------------------------------------------------------------------


  // --- Método principal para manejar el envío del formulario (Crear o Actualizar) ---
  onSubmit(): void {
    console.log('[FORM] 📩 Botón Submit clickeado.'); // Log de inicio de submit

    // Loguear el estado actual de las variables clave ANTES de la validación/envío
    console.log('[DEBUG FORM] onSubmit: selectedIdDesaparecido ANTES VALIDACIÓN =', this.selectedIdDesaparecido);
    console.log('[DEBUG FORM] onSubmit: avistamientoFormData.personaDesaparecida ANTES VALIDACIÓN =', JSON.parse(JSON.stringify(this.avistamientoFormData.personaDesaparecida)));
    console.log('[DEBUG FORM] onSubmit: avistamientoFormData.ubicacion ANTES VALIDACIÓN =', this.avistamientoFormData.ubicacion);
    console.log('[DEBUG FORM] onSubmit: avistamientoFormData.fecha ANTES VALIDACIÓN =', this.avistamientoFormData.fecha);


    
    if (this.avistamientoForm && !this.avistamientoForm.form.valid) {
        this.mensaje = 'Por favor, completa todos los campos requeridos (*).'; // Mensaje genérico de error de validación
        console.warn('[FORM] 🚫 Formulario inválido según Angular form validation.', this.avistamientoForm.form.errors); // Log de detalles de validación

        // Marcar todos los campos con validadores como "touched" para que los mensajes de error de Angular se muestren en la UI
        Object.values(this.avistamientoForm.controls).forEach(control => {
            // Solo marcar si el control está habilitado y tiene validadores definidos
            if (control.enabled && control.validator) {
                 control.markAsTouched();
                 // control.updateValueAndValidity(); // Opcional: forzar re-evaluación de validez
            }
        });
        this.cdr.detectChanges(); // Forzar detección de cambios para mostrar mensajes de error
        return; // Detener el proceso de submit si el formulario es inválido por validaciones de Angular
    }

    
     if (this.selectedIdDesaparecido === null) { // Chequear el ngModel del select directamente
         this.mensaje = 'Debes seleccionar un Reporte.'; // Mensaje específico para este error
         this.isLoading = false; // Ocultar indicador si está visible
         console.warn('[FORM] 🚫 Validación manual fallida - selectedIdDesaparecido es null.');
         if (this.avistamientoForm?.controls['personaDesaparecidaSelect']) {
              this.avistamientoForm.controls['personaDesaparecidaSelect'].markAsTouched();
         }
         this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje
         return; // Detener el proceso de submit
     }
      // 2. Validar que el ID del reporte se asignó correctamente en formData (error interno si esto falla)
      if (!this.avistamientoFormData.personaDesaparecida?.idDesaparecido) {
         this.mensaje = 'Error interno: ID de persona desaparecida no asignado correctamente.'; // Mensaje de error interno
         this.isLoading = false; // Ocultar indicador si está visible
         console.error('[FORM] ❌ Error crítico - avistamientoFormData.personaDesaparecida.idDesaparecido no está seteado pese a que selectedIdDesaparecido sí podría estarlo.');
         this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje
         return; // Detener el proceso de submit
      }

     // 3. Validar que se seleccionó una Ubicación en el mapa (campo `ubicacion` en formData)
     if (!this.avistamientoFormData.ubicacion) {
         this.mensaje = 'Debes seleccionar la Ubicación en el mapa.'; // Mensaje específico para este error
         this.isLoading = false; // Ocultar indicador si está visible
         console.warn('[FORM] 🚫 Validación manual fallida - ubicacion es null/vacío.');
          // Opcional: Marcar el input readonly asociado a la ubicación como touched para que su mensaje de error se muestre (si lo tienes)
          if (this.avistamientoForm?.controls['lugarDisplay']) {
               this.avistamientoForm.controls['lugarDisplay'].markAsTouched();
          }
          this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje
         return; // Detener el proceso de submit
     }
      // 4. Validar que la Fecha es obligatoria (aunque el 'required' del input y ngForm deberían cubrirlo)
      if (!this.avistamientoFormData.fecha) {
          this.mensaje = 'La fecha del avistamiento es obligatoria.'; // Mensaje específico para este error
          this.isLoading = false; // Ocultar indicador si está visible
           console.warn('[FORM] 🚫 Validación manual fallida - fecha es null/vacío.');
           // Opcional: Marcar el input de fecha como touched
            if (this.avistamientoForm?.controls['fecha']) {
                this.avistamientoForm.controls['fecha'].markAsTouched();
           }
           this.cdr.detectChanges(); // Forzar detección para mostrar el mensaje
          return; // Detener el proceso de submit
      }


    // Si todas las validaciones pasan, mostrar el indicador de carga y proceder
    this.isLoading = true;

    
    const payload: any = { // Usar 'any' temporalmente si la interfaz Avistamiento es demasiado estricta para el payload
      
      personaDesaparecida: {
      
        idDesaparecido: this.avistamientoFormData.personaDesaparecida?.idDesaparecido
        
      },
      fecha: this.avistamientoFormData.fecha, // String "YYYY-MM-DD" (del input date)
      ubicacion: this.avistamientoFormData.ubicacion, // String "Lat, Lng" (del clic en el mapa)
      descripcion: this.avistamientoFormData.descripcion || null // Asegurar que sea null si está vacío/undefined

      
    };

    
     if (payload.personaDesaparecida && payload.personaDesaparecida.idDesaparecido === null) {
          console.warn('[DEBUG FORM] Payload personaDesaparecida.idDesaparecido es null. Enviando personaDesaparecida: null');
          payload.personaDesaparecida = null; // O {} según lo que espere tu backend para desvincular si eso es posible
     }


    console.log('[FORM] 🛠️ Datos del formulario listos para enviar:', JSON.parse(JSON.stringify(this.avistamientoFormData))); // Log del estado completo del formData
    console.log('[FORM] 📤 Payload preparado para enviar:', JSON.parse(JSON.stringify(payload))); // Log del payload final a enviar


    if (this.isEditing && this.avistamientoFormData.idAvistamiento !== undefined) {
      // Si estamos en modo edición y tenemos un ID de avistamiento válido
      console.log(`[FORM] Modo Edición: ID ${this.avistamientoFormData.idAvistamiento}. Llamando a actualizarAvistamiento.`);
      
      this.actualizarAvistamiento(this.avistamientoFormData.idAvistamiento as number, payload); // Pasar solo el payload, ID va en URL

    } else {
      // Si no estamos en modo edición (modo creación)
      console.log('[FORM] Modo Creación. Llamando a crearAvistamiento.');
      
      const emailUsuario = this.usuarioService.getCurrentUserEmail();
      if (!emailUsuario) {
           this.mensaje = 'Debes iniciar sesión para registrar un avistamiento.';
           this.isLoading = false; // Ocultar indicador
           console.warn('[FORM] 🚫 Usuario no logueado al intentar crear.');
           this.cdr.detectChanges();
           return; // Detener si no hay usuario logueado
      }
      const createPayload = { ...payload, emailUsuario: emailUsuario };
      this.crearAvistamiento(createPayload);
    }
  }
 
  crearAvistamiento(payload: any): void { // Acepta el payload completo de creación (que ya incluye emailUsuario)
    console.log('[FORM] 📤 Payload para CREAR avistamiento enviado a service:', payload);

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