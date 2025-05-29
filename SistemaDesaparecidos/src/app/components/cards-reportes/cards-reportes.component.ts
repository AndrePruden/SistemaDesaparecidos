import { ReportesService } from '../../services/reportes.service';
// Importa ChangeDetectorRef, OnDestroy, PLATFORM_ID
import { Component, Inject, OnInit, PLATFORM_ID, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
// --- Importa Subscription y la interfaz Avistamiento desde AvistamientoService ---
import { AvistamientoService, Avistamiento } from '../../services/avistamiento.service';
// -----------------------------------------------------------------------------
import { RouterModule } from '@angular/router';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
// Importa MatSnackBar y MatDialog si los usas
import { MatSnackBar } from '@angular/material/snack-bar'; // Asegúrate de tener este módulo si usas MatSnackBar
import { MatDialog } from '@angular/material/dialog'; // Asegúrate de tener este módulo si usas MatDialog
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component'; // Asegúrate de tener este componente si usas MatDialog
import * as L from 'leaflet'; // Asegúrate de tener leaflet instalado y typings si usas tipado estricto
import { Subscription } from 'rxjs'; // Importa Subscription


// Interfaz Reporte local (puede ser que necesites importarla de ReportesService)
// Asegúrate de que la interfaz Reporte aquí coincida con la estructura que recibes y usas.
interface Reporte {
  imagen: string;
  idDesaparecido: number;
  nombre: string;
  edad: number;
  lugarDesaparicion: string; // Coordenadas originales del reporte
  fechaDesaparicion: string;
  lugarDesaparicionLegible: string; // Dirección geocodificada del reporte
  ultimoAvistamiento?: Avistamiento | null; // Información del último avistamiento asociado (usando la interfaz importada)
  descripcion: string; // Descripción del reporte
  estado: boolean; // Añadido basado en tu html (filtrado por estado)
  emailReportaje: string; // Añadido basado en tu html (puedeArchivar)
}

// La interfaz Avistamiento se importa desde AvistamientoService.ts, no es necesario definirla localmente aquí.
// Remueve la definición local si importas la del servicio:
/*
interface Avistamiento {
  ubicacion: string;
  fecha: string;
  descripcion: string;
}
*/


@Component({
  selector: 'app-cards-reportes',
  standalone: true, // Si usas standalone, asegúrate de que sea true
  templateUrl: './cards-reportes.component.html',
  // Asegúrate de que los imports aquí cubren todo lo usado en el template
  // Si usas MatSnackBar y MatDialog/ConfirmDialogComponent y son standalone, impórtalos aquí.
  // Si no son standalone, deben estar importados en el NgModule que usa este componente.
  imports: [CommonModule, FormsModule, RouterModule /* , MatSnackBarModule, MatDialogModule, ConfirmDialogComponent (si son standalone) */], // Ajusta imports si son standalone
  styleUrls: ['./cards-reportes.component.scss']
})
// Implementa OnDestroy para limpiar la suscripción
export class CardsReportesComponent implements OnInit, OnDestroy {
  reportes: Reporte[] = []; // Lista completa de reportes (filtrada inicialmente por estado/email)
  reportesFiltrados: Reporte[] = []; // Lista visible después de aplicar filtros

  // Variables de filtro
  nombreBusqueda = '';
  edadBusqueda: number | null = null;
  lugarBusqueda = '';
  fechaBusqueda = ''; // Asumiendo 'YYYY-MM-DD' string

  mapas: { [key: string]: L.Map | null } = {}; // Instancias de mapa por ID de reporte para los popups, permitir null
  reporteSeleccionado: Reporte | null = null; // Reporte actualmente seleccionado para mostrar en popup

  // --- Añadir propiedad para el email del usuario actual (si no la tienes) ---
  // Si ya la tienes en el constructor, solo asegúrate de que esté inicializada.
  emailUsuarioActual: string | null = null;
  // ---------------------------------------------------------------------------


  // Variable para almacenar la suscripción al observable de cambios de avistamiento
  // Asegúrate de que el nombre coincida con el del servicio (`avistamientoCambiado$`)
  private avistamientoChangeSubscription: Subscription | undefined;

  constructor(
    private reportesService: ReportesService,
    // --- Inyecta el servicio de avistamientos ---
    private avistamientoService: AvistamientoService,
    // -------------------------------------------
    private geocodificacionService: GeocodificacionService,
    private mapService: MapService, // Inyecta el servicio de mapas
    private cdr: ChangeDetectorRef, // Inyecta ChangeDetectorRef
    @Inject(PLATFORM_ID) private platformId: Object,
    // --- Inyecta MatSnackBar y MatDialog si los usas (Asegúrate de que estén configurados en tu App/Core Module o como standalones) ---
    private snackBar: MatSnackBar,
    private dialog: MatDialog
    // -----------------------------------------------------------------------------------------------------------------------------------
  ) {
      console.log('[CARDS] Componente construido.');
      // Obtener el email del usuario aquí o en ngOnInit, dependiendo de dónde lo tengas disponible primero
      if (isPlatformBrowser(this.platformId)) {
           this.emailUsuarioActual = localStorage.getItem('email'); // O de tu servicio de autenticación
           console.log('[CARDS] Email de usuario actual (desde localStorage):', this.emailUsuarioActual);
      }
  }

  ngOnInit(): void {
    console.log('[CARDS] ngOnInit iniciado.');
    if (isPlatformBrowser(this.platformId)) {
      console.log('[CARDS] Navegador detectado.');
      this.obtenerReportes(); // Carga inicial de reportes

      // --- Suscribirse a notificaciones de cambio en avistamientos ---
      // Cuando AvistamientoService notifique un cambio (creación/actualización),
      // recargamos la información del último avistamiento para los reportes actuales.
      // Asegúrate que el Subject en el servicio se llama `avistamientoCambiadoSource` y emite `avistamientoCambiado$`.
      this.avistamientoChangeSubscription = this.avistamientoService.avistamientoCambiado$.subscribe(() => {
         console.log('[CARDS] 🟠 Cambio en avistamientos detectado (desde service). Recargando últimos avistamientos...');
         // Recarga solo los últimos avistamientos para los reportes que ya tenemos
         // No necesitas recargar *todos* los reportes (obtenerReportes()) a menos que un avistamiento
         // pudiera cambiar datos *del reporte* (lo cual no debería pasar).
         // Tampoco necesitas volver a geocodificar las direcciones de los reportes.
         this.cargarUltimosAvistamientos(); // Esto es lo que actualiza la info del popup y la card si el último avistamiento cambió
         // Forzar detección de cambios para que la UI se actualice después de cargar los últimos avistamientos
         this.cdr.detectChanges();
      });
      // ---------------------------------------------------------------

    } else {
        console.warn('[CARDS] No se ejecuta en navegador (SSR), omitiendo lógica.');
    }
  }

  // Limpiar la suscripción y mapas al destruir el componente
  ngOnDestroy(): void {
      console.log('[CARDS] ngOnDestroy iniciado.');
      if (this.avistamientoChangeSubscription) {
          console.log('[CARDS] 🟠 Desuscribiendo de avistamientoChangeSubscription');
          this.avistamientoChangeSubscription.unsubscribe();
      }
      // Limpiar instancias de mapa al destruir (aunque el popup ya lo hace al cerrar)
      this.limpiarTodosLosMapas();
      console.log('[CARDS] ngOnDestroy finalizado.');
  }


  // Carga todos los reportes desde el backend
  obtenerReportes(): void {
    console.log('[CARDS] [DATA] Solicitando todos los reportes...');
    this.reportesService.obtenerReportes().subscribe(
      // Usar la interfaz Reporte (si está definida localmente o importada)
      (data: Reporte[]) => { // Asumiendo que ReportesService.obtenerReportes() devuelve Reporte[] o any[]
        console.log('[CARDS] [DATA] Reportes cargados (crudos):', data.length, 'elementos.');

        // --- Lógica de filtrado inicial por estado y email ---
        // Tu lógica actual está bien si esto es lo que quieres mostrar inicialmente
        const emailUsuario = this.emailUsuarioActual;
        this.reportes = data.filter(reporte =>
          reporte.estado === true || (emailUsuario !== null && reporte.emailReportaje === emailUsuario)
        );
         console.log('[CARDS] [DATA] Reportes filtrados inicialmente (estado=true O mi email):', this.reportes.length, 'elementos.');
        // ----------------------------------------------------


        this.reportesFiltrados = [...this.reportes]; // Initialize filtered list with the initial filtered set
        console.log('[CARDS] [DATA] Reportes filtrados inicializados.');

        // Iniciar procesos asíncronos para cada reporte visible (en la lista 'reportes')
        // Geocodificamos y cargamos últimos avistamientos para TODOS los reportes que pasaron el filtro inicial
        this.setDireccionesReportes(this.reportes); // Geocodificación inversa para lugarDesaparicion
        this.cargarUltimosAvistamientos(this.reportes); // Cargar el último avistamiento asociado

        this.cdr.detectChanges(); // Forzar detección de cambios después de cargar data
      },
      (err) => {
          console.error('[CARDS] [ERROR] al obtener reportes:', err);
           // Opcional: Mostrar un mensaje de error al usuario
           this.reportes = [];
           this.reportesFiltrados = [];
           this.cdr.detectChanges();
      }
    );
  }

  // Geocodifica las coordenadas de lugarDesaparicion a una dirección legible
  // Aceptar una lista opcional para procesar (reportes o reportesFiltrados)
  setDireccionesReportes(reporteList: Reporte[] = this.reportesFiltrados): void {
      console.log('[CARDS] [DATA] Iniciando geocodificación inversa...');
    // Usamos la lista pasada como argumento
    reporteList.forEach(reporte => {
      // Evitar geocodificar si ya tiene una dirección legible (ej. vino del backend)
      // o si ya está en proceso (podrías usar una bandera)
      if (reporte.lugarDesaparicionLegible && reporte.lugarDesaparicionLegible !== '' && reporte.lugarDesaparicionLegible !== 'Ubicación desconocida') {
          //console.log(`[CARDS] [DATA] Reporte ${reporte.idDesaparecido} ya tiene lugar legible.`);
          return;
      }
      // Inicializar con un placeholder si no tiene lugar legible
      if (!reporte.lugarDesaparicionLegible || reporte.lugarDesaparicionLegible === '') {
          reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Cargando...';
      }

      const coords = this.mapService.parsearCoords(reporte.lugarDesaparicion);
      if (coords) {
         //console.log(`[CARDS] [DATA] Geocodificando coords ${coords} para reporte ${reporte.idDesaparecido}...`);
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => {
             //console.log(`[CARDS] [DATA] Dir recibida para ${reporte.idDesaparecido}: ${direccion}`);
             reporte.lugarDesaparicionLegible = direccion;
             // Forzar detección de cambios para actualizar la UI a medida que llegan las direcciones
             this.cdr.detectChanges();
          },
          error: (err) => {
            console.warn(`[CARDS] [DATA] Error geocodificando coords ${coords} para reporte ${reporte.idDesaparecido}:`, err.message || 'Unknown Error');
            reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Ubicación desconocida'; // Fallback a coords o placeholder
             this.cdr.detectChanges();
          }
        });
      } else {
        console.warn(`[CARDS] [DATA] No hay coords válidas para geocodificar reporte ${reporte.idDesaparecido}:`, reporte.lugarDesaparicion);
        reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Ubicación no disponible'; // Fallback a coords o placeholder
         // Trigger change detection here too if fallback is set
         this.cdr.detectChanges();
      }
    });
     console.log('[CARDS] [DATA] Proceso de geocodificación inversa iniciado.');
  }

  // Carga el último avistamiento para cada reporte
  // Aceptar una lista opcional para procesar
  cargarUltimosAvistamientos(reporteList: Reporte[] = this.reportesFiltrados): void {
      console.log('[CARDS] [DATA] Cargando últimos avistamientos para reportes...');
    // Usamos la lista pasada como argumento
    reporteList.forEach(reporte => {
      // Solo si el reporte tiene un ID válido
      if (reporte.idDesaparecido !== null && reporte.idDesaparecido !== undefined) {
          console.log(`[CARDS] [DATA] Solicitando último avistamiento para reporte ID: ${reporte.idDesaparecido}`);
           // --- Usar el método del servicio que obtiene el último avistamiento ---
           this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).subscribe({
           // ---------------------------------------------------------------------
             next: (avistamiento: Avistamiento | null) => { // El servicio devuelve Avistamiento o null
               // Asigna el avistamiento recibido (o null si no se encontró)
               reporte.ultimoAvistamiento = avistamiento;
                console.log(`[CARDS] [DATA] Último avistamiento recibido para reporte ${reporte.idDesaparecido}:`, avistamiento ? avistamiento : 'Ninguno'); // Log el resultado
               // Forzar detección de cambios para actualizar la UI con el último avistamiento
               this.cdr.detectChanges();

               // Si el popup está abierto para este reporte, actualizar su mapa también
               if (this.reporteSeleccionado && this.reporteSeleccionado.idDesaparecido === reporte.idDesaparecido) {
                   console.log(`[CARDS] [DATA] Popup abierto para reporte ${reporte.idDesaparecido}. Actualizando popup.`);
                   this.reporteSeleccionado.ultimoAvistamiento = avistamiento; // Actualizar el objeto en reporteSeleccionado también
                   // Re-renderizar el mapa del popup con la nueva información
                   const coordsDesaparicion = this.mapService.parsearCoords(reporte.lugarDesaparicion);
                   if(coordsDesaparicion){
                        console.log('[CARDS] [DATA] Re-renderizando mapa del popup con nuevo último avistamiento...');
                        this.renderizarMapa(this.reporteSeleccionado, coordsDesaparicion).catch(err => console.error("Error re-renderizando mapa de popup", err));
                   } else {
                        console.warn('[CARDS] [DATA] No se pudo re-renderizar mapa del popup: Coordenadas de desaparición inválidas.');
                   }
               }


             },
             error: (err) => {
               console.error(`[CARDS] [ERROR] al obtener último avistamiento para reporte ${reporte.idDesaparecido}:`, err);
               reporte.ultimoAvistamiento = null; // Asegurarse de que sea null en caso de error
                this.cdr.detectChanges();
             }
           });
      } else {
           console.warn('[CARDS] [DATA] Reporte sin idDesaparecido, no se puede cargar último avistamiento.', reporte);
      }
    });
     console.log('[CARDS] [DATA] Proceso de carga de últimos avistamientos iniciado.');
  }

  // Abre el popup del mapa para un reporte
  async mostrarPopup(reporte: Reporte): Promise<void> {
    console.log('[CARDS] [POPUP] Mostrando popup para reporte ID:', reporte.idDesaparecido);
    // Hacer una copia profunda o mapear solo las propiedades necesarias si hay problemas de referencias
    this.reporteSeleccionado = { ...reporte }; // Copia el reporte seleccionado

    // Si el último avistamiento no se ha cargado para este reporte aún, o quieres asegurarte de tener el más reciente,
    // puedes hacer una llamada específica para el popup, pero la suscripción en ngOnInit ya debería cubrir esto.
    // Si quieres FORZAR la recarga del último avistamiento cada vez que abres el popup:
    // console.log('[CARDS] [POPUP] Recargando último avistamiento específicamente para el popup...');
    // try {
    //      const ultimoAvistamientoPopup = await this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).toPromise(); // Usar toPromise si no estás en un observable chain
    //      this.reporteSeleccionado.ultimoAvistamiento = ultimoAvistamientoPopup;
    //      console.log('[CARDS] [POPUP] Último avistamiento recargado para popup:', ultimoAvistamientoPopup);
    // } catch (err) {
    //      console.error('[CARDS] [POPUP] Error recargando último avistamiento para popup:', err);
    //      this.reporteSeleccionado.ultimoAvistamiento = null;
    // }


    this.cdr.detectChanges(); // Asegurar que el *ngIf del popup se activa

    const coordsDesaparicion = this.mapService.parsearCoords(reporte.lugarDesaparicion);

    if (coordsDesaparicion) {
        console.log('[CARDS] [POPUP] Coordenadas de desaparición válidas, renderizando mapa...');
        await this.renderizarMapa(this.reporteSeleccionado, coordsDesaparicion); // Pasar reporteSeleccionado
    } else {
        console.warn('[CARDS] [POPUP] Coordenadas de desaparición no válidas:', reporte.lugarDesaparicion, 'No se mostrará el mapa de desaparición.');
         // Mostrar un mensaje de error en el popup si las coordenadas son inválidas
         // Esto ya lo manejas con el *ngIf en el html dentro del div del mapa
    }
  }

  // Renderiza el mapa en el popup
  // Aceptar el reporte que debe usarse (normalmente reporteSeleccionado)
  private async renderizarMapa(reporte: Reporte, coordsDesaparicion: [number, number]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
         console.warn('[CARDS] [POPUP MAP] No se puede renderizar mapa: No es navegador.');
         return;
    }
    console.log('[CARDS] [POPUP MAP] Iniciando renderizado de mapa para ID:', reporte.idDesaparecido);

    // Pequeña pausa para asegurar que el DOM se ha actualizado y el div del mapa existe
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log('[CARDS] [POPUP MAP] Pausa de 150ms completada.');

    const mapaId = 'mapaPopup-' + reporte.idDesaparecido;
    const divMapa = document.getElementById(mapaId);

    if (!divMapa) {
        console.error(`[CARDS] [POPUP MAP] ❌ Div del mapa no encontrado en el DOM: ${mapaId}.`);
        return;
    }
     console.log(`[CARDS] [POPUP MAP] ✅ Div del mapa encontrado: ${mapaId}`);

    // Asegurar dimensiones
    divMapa.style.height = '400px';
    divMapa.style.width = '100%';
     console.log('[CARDS] [POPUP MAP] Dimensiones del div del mapa aseguradas.');


    // Limpia mapa existente para este ID
    if (this.mapas[mapaId]) {
        console.log(`[CARDS] [POPUP MAP] Limpiando mapa existente para ${mapaId}.`);
        this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map
        this.mapas[mapaId] = null; // Establecer a null después de eliminar
        console.log(`[CARDS] [POPUP MAP] Mapa existente para ${mapaId} limpiado.`);
    }

    try {
         // Crea el mapa usando el servicio
         console.log('[CARDS] [POPUP MAP] Creando nueva instancia de mapa via MapService...');
         const mapa = this.mapService.crearMapa(mapaId, coordsDesaparicion);
         if (!mapa) {
             throw new Error('El MapService devolvió un mapa nulo al crearlo.');
         }
         this.mapas[mapaId] = mapa; // Guarda la instancia del mapa


         // Añade marcador principal para el lugar de desaparición
         console.log('[CARDS] [POPUP MAP] Añadiendo marcador de desaparición...');
         this.mapService.agregarMarcador(
           mapa, // Pasar instancia L.Map
           coordsDesaparicion,
           'red', // Icono rojo para desaparición
           'Lugar de desaparición',
           reporte?.lugarDesaparicionLegible || reporte.lugarDesaparicion || '' // Usar lugarLegible del reporte pasado
         );
         console.log('[CARDS] [POPUP MAP] Marcador de desaparición añadido.');


         let coordsAvistamiento: [number, number] | null = null;
         // Manejo de avistamientos - Añade marcador si hay último avistamiento
         // Usar el último avistamiento del reporte pasado (puede ser reporteSeleccionado)
         if (reporte?.ultimoAvistamiento?.ubicacion) {
           coordsAvistamiento = this.mapService.parsearCoords(
             reporte.ultimoAvistamiento.ubicacion
           );
           if (coordsAvistamiento) {
               console.log('[CARDS] [POPUP MAP] Coordenadas de último avistamiento válidas. Añadiendo marcador...');
             this.mapService.agregarMarcador(
               mapa, // Pasar instancia L.Map
               coordsAvistamiento,
               'blue', // Icono azul para avistamiento
               'Último avistamiento',
               // Usar los detalles del avistamiento del reporte pasado
               `Fecha: ${new Date(reporte.ultimoAvistamiento.fecha).toLocaleDateString()} ${new Date(reporte.ultimoAvistamiento.fecha).toLocaleTimeString()} <br> Detalles: ${reporte.ultimoAvistamiento.descripcion || 'No hay detalles adicionales'}`
             );
              console.log('[CARDS] [POPUP MAP] Marcador de último avistamiento añadido.');
           } else {
               console.warn('[CARDS] [POPUP MAP] Coordenadas de último avistamiento no válidas:', reporte.ultimoAvistamiento.ubicacion);
           }
         } else {
             console.log('[CARDS] [POPUP MAP] No hay último avistamiento o no tiene ubicación válida para mostrar en mapa para reporte ID:', reporte.idDesaparecido);
         }

         // Ajustar la vista del mapa para incluir ambos marcadores si existe el de avistamiento
         if (coordsAvistamiento) {
             console.log('[CARDS] [POPUP MAP] Ajustando vista para ambos marcadores...');
             this.mapService.ajustarVista(mapa, coordsDesaparicion, coordsAvistamiento);
         } else {
              console.log('[CARDS] [POPUP MAP] Ajustando vista solo para el marcador de desaparición.');
              // Si solo hay marcador de desaparición, simplemente centrar y quizás ajustar zoom
              mapa.setView(coordsDesaparicion, mapa.getZoom() > 10 ? mapa.getZoom() : 13); // Centrar en desaparición, ajustar zoom si es muy bajo
         }


         // Forzar redibujado del mapa después de un breve retardo - crucial si está dentro de un popup/modal
         setTimeout(() => {
           const currentMap = this.mapas[mapaId];
           if(currentMap){ // Check if map still exists
              console.log('[CARDS] [POPUP MAP] Llamando a invalidateSize...');
              currentMap.invalidateSize(); // Asegura que el mapa se renderice correctamente dentro del div
              console.log('[CARDS] [POPUP MAP] ✅ Mapa renderizado y listo en el popup.');
           } else {
               console.warn('[CARDS] [POPUP MAP] Mapa ya no existe al intentar llamar a invalidateSize.');
           }
           this.cdr.detectChanges(); // Asegurar que la UI se actualiza
         }, 100); // Un pequeño retraso es a menudo necesario

    } catch (error: any) {
        console.error('[CARDS] [POPUP MAP] ❌ ERROR FATAL al renderizar mapa:', error);
         // Puedes mostrar un mensaje de error en la UI del popup si lo deseas
         const errorDiv = document.createElement('div');
         errorDiv.style.color = 'red';
         errorDiv.style.padding = '10px';
         errorDiv.style.textAlign = 'center';
         errorDiv.innerHTML = `<h4>Error al cargar el mapa</h4><p>${error.message || 'Error desconocido'}</p><p>Coordenadas: ${reporte.lugarDesaparicion || 'No disponibles'}</p><p>Ver consola (F12) para más detalles.</p>`;
         if (divMapa) {
             divMapa.innerHTML = ''; // Limpia contenido anterior
             divMapa.appendChild(errorDiv);
             divMapa.style.border = '2px solid red';
         }
         this.cdr.detectChanges();
    }
  }


  // Cierra el popup y limpia la instancia del mapa asociada
  cerrarPopup(): void {
    console.log('[CARDS] [POPUP] Cerrando popup.');
    if (this.reporteSeleccionado) {
      const mapaId = 'mapaPopup-' + this.reporteSeleccionado.idDesaparecido;
      if (this.mapas[mapaId]) {
         console.log(`[CARDS] [POPUP] Limpiando mapa ${mapaId} al cerrar popup.`);
         // Usar MapService para eliminar
         this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map
         this.mapas[mapaId] = null; // Establecer a null después de eliminar
         console.log(`[CARDS] [POPUP] Mapa ${mapaId} limpiado.`);
      }
    } else {
        console.log('[CARDS] [POPUP] No hay reporte seleccionado, nada que limpiar.');
    }
    this.reporteSeleccionado = null; // Oculta el popup
    this.cdr.detectChanges(); // Asegura que el *ngIf se desactive
    console.log('[CARDS] [POPUP] Popup cerrado.');
  }


  // Limpia todas las instancias de mapa guardadas (útil en ngOnDestroy)
  private limpiarTodosLosMapas(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    console.log('[CARDS] [DESTROY] Limpiando todas las instancias de mapa...');
    for (const mapaId in this.mapas) {
      if (this.mapas[mapaId]) {
        console.log(`[CARDS] [DESTROY] Limpiando mapa ${mapaId}...`);
         // Usar MapService para eliminar
         this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map
         this.mapas[mapaId] = null; // Establecer a null
      }
    }
    this.mapas = {}; // Reset the map instances object
    console.log('[CARDS] [DESTROY] Todas las instancias de mapa limpiadas.');
  }


  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/470100848/es/vector/macho-icono-de-perfil-blanco-en-fondo-azul.jpg?s=612x612&w=0&k=20&c=HVwuxvS7hDgG6qOZXRXvsHbLVRKP5zrIllm09LWMgjc=';
  }

  puedeArchivar(reporte: Reporte): boolean {
    // Asegurarse de que emailUsuarioActual no sea null antes de comparar
    return this.emailUsuarioActual !== null && this.emailUsuarioActual === reporte.emailReportaje && reporte.estado === true;
  }

  archivarReporte(id: number): void {
      console.log('[CARDS] Intentando archivar reporte ID:', id);
      // Asegúrate de que el email del usuario actual se obtenga correctamente
      if (this.emailUsuarioActual === null) {
          console.warn('[CARDS] No se puede archivar: Usuario no logueado o email no disponible.');
           this.snackBar.open('Debes iniciar sesión para archivar reportes.', 'Cerrar', { duration: 3000 });
           return;
      }
       // Buscar el reporte en la lista para verificar si el usuario actual es el creador
       const reporteToArchive = this.reportes.find(r => r.idDesaparecido === id);
       if (!reporteToArchive || reporteToArchive.emailReportaje !== this.emailUsuarioActual) {
            console.warn('[CARDS] No se puede archivar: El usuario actual no creó este reporte o el reporte no existe/ya está archivado.');
            this.snackBar.open('Solo puedes archivar reportes que tú has creado.', 'Cerrar', { duration: 3000 });
            return;
       }
        if (!reporteToArchive.estado) {
             console.warn('[CARDS] No se puede archivar: El reporte ya está archivado.');
             this.snackBar.open('Este reporte ya está archivado.', 'Cerrar', { duration: 3000 });
             return;
        }


    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Estás seguro de archivar este reporte?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
          console.log('[CARDS] Confirmación de archivo recibida. Llamando a ReportesService...');
        this.reportesService.archivarReporte(id).subscribe({
          next: (response) => {
            console.log('[CARDS] ✅ Reporte archivado con éxito:', response);
            this.snackBar.open('Reporte archivado con éxito', 'Cerrar', { duration: 3000 });
            // --- Volver a obtener reportes para actualizar la lista visible ---
            this.obtenerReportes();
            // ----------------------------------------------------------------
          },
          error: (err) => {
            console.error('[CARDS] ❌ Error al archivar el reporte:', err);
             // Mostrar mensaje de error más útil si es posible
            this.snackBar.open(`Error al archivar el reporte: ${err.error?.message || err.message || 'Desconocido'}`, 'Cerrar', { duration: 5000 });
          }
        });
      } else {
          console.log('[CARDS] Archivo cancelado por el usuario.');
      }
    });
  }


  filtrarReportes(): void {
    console.log('[CARDS] [FILTRO] Aplicando filtros...');
    // Filtramos sobre la lista completa 'reportes' (que ya tiene el filtro inicial por estado/email)
    this.reportesFiltrados = this.reportes.filter(reporte => {
      const nombreMatch = !this.nombreBusqueda ||
        reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());

      // Assuming exact age match for number input, handle null
      const edadMatch = this.edadBusqueda === null ||
        reporte.edad === this.edadBusqueda;

      // Use lugarDesaparicionLegible for filtering if available, fallback to raw
      // Ensure it's not null/undefined before calling methods
      const lugarReporteTexto = reporte.lugarDesaparicionLegible && reporte.lugarDesaparicionLegible !== '' ? reporte.lugarDesaparicionLegible : (reporte.lugarDesaparicion || '');
      const lugarMatch = !this.lugarBusqueda ||
        lugarReporteTexto.toLowerCase().includes(this.lugarBusqueda.toLowerCase());


      // Filter by date - Assuming fechaBusqueda is a date string like 'YYYY-MM-DD'
      // Ensure reporte.fechaDesaparicion is not null before comparison
      const fechaReporteStr = reporte.fechaDesaparicion;
      const fechaMatch = !this.fechaBusqueda ||
         (fechaReporteStr && fechaReporteStr.startsWith(this.fechaBusqueda)); // Simple prefix match "YYYY-MM-DD"

      return nombreMatch && edadMatch && lugarMatch && fechaMatch;
    });
     console.log('[CARDS] [FILTRO] Resultados filtrados:', this.reportesFiltrados.length);
     // No necesitas cargar últimos avistamientos o geocodificar de nuevo solo por filtrar,
     // ya se hizo en la carga inicial sobre la lista completa `this.reportes`.
     this.cdr.detectChanges(); // Force detection after filtering
  }


  limpiarFiltros(): void {
    console.log('[CARDS] [FILTRO] Limpiando filtros...');
    this.nombreBusqueda = '';
    this.edadBusqueda = null;
    this.lugarBusqueda = '';
    this.fechaBusqueda = '';
    this.filtrarReportes(); // Apply filters again (which will show all reports from the initial filtered set)
  }
}