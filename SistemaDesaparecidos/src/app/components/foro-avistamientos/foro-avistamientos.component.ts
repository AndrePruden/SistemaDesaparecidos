import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
// --- Importar Router ---
import { RouterModule, Router } from '@angular/router';
// -----------------------
import { FormsModule } from '@angular/forms';
// --- Importar Avistamiento e interfaz Avistamiento ---
import { AvistamientoService, Avistamiento } from '../../services/avistamiento.service';
// -----------------------------------------------------
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
// --- Importar UsuarioService y Subscription ---
import { UsuarioService } from '../../services/usuario.service';
import { Subscription } from 'rxjs';
// ----------------------------------------------

import * as L from 'leaflet';


@Component({
  selector: 'app-foro-avistamientos',
  standalone: true, // Mantener si es standalone
  imports: [CommonModule, RouterModule, FormsModule], // Asegurar imports
  templateUrl: './foro-avistamientos.component.html',
  styleUrls: ['./foro-avistamientos.component.scss']
})
// --- Implementar OnDestroy ---
export class ForoAvistamientosComponent implements OnInit, OnDestroy {
  // Usar la interfaz Avistamiento importada
  avistamientos: Avistamiento[] = [];
  avistamientosFiltrados: Avistamiento[] = [];
  avistamientoSeleccionado: Avistamiento | null = null;

  // Usar tipo correcto para mapas, permitir null para limpieza
  mapas: { [key: string]: L.Map | null } = {};

  nombreBusqueda = '';
  lugarBusqueda = '';
  fechaBusquedaInicio = '';
  fechaBusquedaFin = '';

  // --- Añadir propiedad para el email del usuario actual ---
  currentUserEmail: string | null = null;
  // -------------------------------------------------------

  isLoadingMap = false;
  mapError: string | null = null;

  // --- Suscripciones ---
  private avistamientoChangeSubscription: Subscription | undefined;
  private authStateSubscription: Subscription | undefined;
  // ---------------------


  constructor(
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    public mapService: MapService,
    // --- Inyectar Router ---
    private router: Router,
    // -----------------------
    // --- Inyectar UsuarioService y ChangeDetectorRef ---
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    // -------------------------------------------------
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('[FORO] Componente construido.');
  }

  ngOnInit(): void {
    console.log('[FORO] ngOnInit iniciado.');
    if (isPlatformBrowser(this.platformId)) {
        console.log('[FORO] Navegador detectado.');

        // --- Suscribirse al estado de autenticación para mostrar/ocultar botón Editar ---
        this.authStateSubscription = this.usuarioService.currentUserEmail$.subscribe(email => {
            console.log('[FORO] 👤 Estado de autenticación cambiado. Email actual:', email);
            this.currentUserEmail = email;
            this.cdr.detectChanges(); // Forzar detección de cambios para actualizar UI (*ngIf)
        });
        // ---------------------------------------------------------------------------------
        console.log('[FORO] 👤 ngOnInit: Valor inicial de currentUserEmail:', this.currentUserEmail); // LOG AQUÍ


        this.obtenerAvistamientos(); // Carga inicial de la lista

        // --- Suscribirse a notificaciones de cambio en avistamientos ---
        // Cuando AvistamientoService notifique un cambio (creación/actualización), recargamos la lista completa.
        // Asegúrate que el Subject en el servicio se llama `avistamientoCambiadoSource` y emite `avistamientoCambiado$`.
        this.avistamientoChangeSubscription = this.avistamientoService.avistamientoCambiado$.subscribe(() => {
           console.log('[FORO] 🟠 Cambio en avistamientos detectado (desde service). Recargando lista...');
           this.obtenerAvistamientos(); // Recarga la lista completa
        });
        // ---------------------------------------------------------------

    } else {
        console.warn('[FORO] No se ejecuta en navegador (SSR), omitiendo lógica.');
    }
  }

  // --- Implementar ngOnDestroy para limpiar suscripciones y mapas ---
  ngOnDestroy(): void {
    console.log('[FORO] ngOnDestroy iniciado.');
    this.limpiarTodosLosMapas(); // Limpiar mapas de popups abiertos

    if (this.avistamientoChangeSubscription) {
      console.log('[FORO] 🟠 Desuscribiendo de avistamientoChangeSubscription');
      this.avistamientoChangeSubscription.unsubscribe();
    }
     if (this.authStateSubscription) {
         console.log('[FORO] 👤 Desuscribiendo de authStateSubscription');
         this.authStateSubscription.unsubscribe();
     }
     console.log('[FORO] ngOnDestroy finalizado.');
  }
  // -----------------------------------------------------------------


  obtenerAvistamientos(): void {
    console.log('[FORO] [DATA] Solicitando todos los avistamientos...');
    this.avistamientoService.obtenerTodosLosAvistamientos().subscribe({
      next: (data: Avistamiento[]) => {
        console.log('[FORO] [DATA] Avistamientos cargados:', data.length, 'elementos.');
        // Asegurarse de que cada avistamiento tenga una propiedad personaDesaparecida y nombre antes de usarlo
        this.avistamientos = data.filter(a => a.personaDesaparecida?.nombre); 
        this.avistamientosFiltrados = [...this.avistamientos];
        console.log('[FORO] [DATA] Avistamientos después de filtro inicial (si aplica):', this.avistamientos.length); // LOG AQUÍ
        // LOG los avistamientos filtrados para inspeccionar emailUsuario
        console.log('[FORO] [DATA] AvistamientosFiltrados (para debug emailUsuario):', this.avistamientosFiltrados); // LOG AQUÍ (puede ser grande)
        // Si la lista es muy grande, puedes loguear solo una muestra o mapear los emails:
        // console.log('[FORO] [DATA] Emails de avistamientos:', this.avistamientosFiltrados.map(a => a.emailUsuario)); // LOG AQUÍ

        this.setDireccionesAvistamientos(); 
         this.cdr.detectChanges(); 
      },
      error: (err) => {
          console.error('[FORO] [ERROR] al obtener avistamientos:', err);
           this.avistamientos = [];
           this.avistamientosFiltrados = [];
           this.cdr.detectChanges();
      }
    });
}

  setDireccionesAvistamientos(): void {
     console.log('[FORO] [DATA] Iniciando geocodificación inversa para avistamientos...');
    // Usar this.avistamientos (lista completa) para asegurar que todos son procesados
    this.avistamientos.forEach(avistamiento => {
      // Evitar geocodificar si ya tiene una dirección legible (ej. de una carga anterior o si vino del backend)
      // O si no tiene ubicación válida
      if (avistamiento.lugarDesaparicionLegible && avistamiento.lugarDesaparicionLegible !== '' && avistamiento.lugarDesaparicionLegible !== 'Cargando...') {
          //console.log(`[FORO] [DATA] Avistamiento ${avistamiento.idAvistamiento} ya tiene lugar legible.`);
          return;
      }
      // Inicializar con un placeholder si no tiene lugar legible
       if (!avistamiento.lugarDesaparicionLegible) {
           avistamiento.lugarDesaparicionLegible = avistamiento.ubicacion || 'Cargando...';
       }


      const coords = this.mapService.parsearCoords(avistamiento.ubicacion);
      if (coords) {
        //console.log(`[FORO] [DATA] Geocodificando coords ${coords} para avistamiento ${avistamiento.idAvistamiento}...`);
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => {
             //console.log(`[FORO] [DATA] Dir recibida para ${avistamiento.idAvistamiento}: ${direccion}`);
             avistamiento.lugarDesaparicionLegible = direccion;
             // Forzar detección de cambios para actualizar la UI a medida que llegan las direcciones
             this.cdr.detectChanges();
          },
          error: (err) => {
              console.warn(`[FORO] [DATA] Error geocodificando coords ${coords} para ${avistamiento.idAvistamiento}:`, err.message || 'Unknown Error');
              avistamiento.lugarDesaparicionLegible = avistamiento.ubicacion || 'Ubicación desconocida'; // Fallback
             this.cdr.detectChanges();
          }
        });
      } else {
        console.warn(`[FORO] [DATA] No hay coords válidas para ${avistamiento.idAvistamiento}.`);
        avistamiento.lugarDesaparicionLegible = avistamiento.ubicacion || 'Ubicación no disponible'; // Fallback
         // Trigger change detection here too if fallback is set
         this.cdr.detectChanges();
      }
    });
     console.log('[FORO] [DATA] Proceso de geocodificación inversa iniciado.');
  }


  filtrarAvistamientos(): void {
    console.log('[FORO] [FILTRO] Aplicando filtros...');
    // Asegurarse de que la lista original 'avistamientos' está completa antes de filtrar
    this.avistamientosFiltrados = this.avistamientos.filter(avistamiento => {
      // Asegurarse de que personaDesaparecida y nombre existan antes de acceder a ellos
      const nombreAvistamiento = avistamiento.personaDesaparecida?.nombre || '';
      const nombreMatch = !this.nombreBusqueda ||
        nombreAvistamiento.toLowerCase().includes(this.nombreBusqueda.toLowerCase());

      // Usar lugarDesaparicionLegible para filtrar si está disponible, si no, usar ubicacion
      const lugarAvistamientoTexto = avistamiento.lugarDesaparicionLegible || avistamiento.ubicacion || '';
      const lugarMatch = !this.lugarBusqueda ||
        lugarAvistamientoTexto.toLowerCase().includes(this.lugarBusqueda.toLowerCase());

      // Filtrar por fecha - Asegurando formato de fecha y manejo de nulos
      const fechaAvistamientoStr = avistamiento.fecha; // Asumiendo que es una cadena YYYY-MM-DD o similar
      let fechaMatch = true;

      if (this.fechaBusquedaInicio || this.fechaBusquedaFin) {
          // Intentar parsear la fecha del avistamiento
           const fechaAvistamientoDate = fechaAvistamientoStr ? new Date(fechaAvistamientoStr + 'T00:00:00') : null; // Añadir T00:00:00 para asegurar zona horaria y comparación solo por día

           const fechaInicioDate = this.fechaBusquedaInicio ? new Date(this.fechaBusquedaInicio + 'T00:00:00') : null;
           const fechaFinDate = this.fechaBusquedaFin ? new Date(this.fechaBusquedaFin + 'T23:59:59') : null; // Comparar hasta el final del día

           // Si el avistamiento no tiene fecha, no coincide si hay filtros de fecha
           if (!fechaAvistamientoDate || isNaN(fechaAvistamientoDate.getTime())) {
               fechaMatch = false;
           } else {
                // Comparar fechas
                fechaMatch =
                   (!fechaInicioDate || fechaAvistamientoDate >= fechaInicioDate) &&
                   (!fechaFinDate || fechaAvistamientoDate <= fechaFinDate);
           }
      }


      return nombreMatch && lugarMatch && fechaMatch;
    });
    console.log('[FORO] [FILTRO] Resultados filtrados:', this.avistamientosFiltrados.length);
    this.cdr.detectChanges(); // Forzar detección de cambios después de filtrar
  }


  limpiarFiltros(): void {
    console.log('[FORO] [FILTRO] Limpiando filtros...');
    this.nombreBusqueda = '';
    this.lugarBusqueda = '';
    this.fechaBusquedaInicio = '';
    this.fechaBusquedaFin = '';
    this.filtrarAvistamientos(); // Aplicar filtros de nuevo (mostrará todos)
  }


  async mostrarPopup(avistamiento: Avistamiento): Promise<void> {
    console.log('[FORO] [POPUP] Mostrando popup para avistamiento ID:', avistamiento.idAvistamiento);
    this.avistamientoSeleccionado = { ...avistamiento }; // Copia defensiva
    this.isLoadingMap = true;
    this.mapError = null; // Limpiar error previo
    this.cdr.detectChanges(); // Asegurar que el *ngIf del popup se activa

     // Asegurar que el lugar legible se calcule si no existe o es placeholder
    if (!this.avistamientoSeleccionado.lugarDesaparicionLegible || this.avistamientoSeleccionado.lugarDesaparicionLegible === 'Cargando...') {
         console.log('[FORO] [POPUP] Lugar legible no disponible, intentando geocodificar para popup...');
         const coordsForPopup = this.mapService.parsearCoords(avistamiento.ubicacion);
        if (coordsForPopup) {
            console.log('[FORO] [POPUP] Geocodificando ubicación para popup...');
            this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coordsForPopup[0], coordsForPopup[1]).subscribe({
              next: direccion => {
                  this.avistamientoSeleccionado!.lugarDesaparicionLegible = direccion;
                  console.log('[FORO] [POPUP] Ubicación geocodificada para popup:', direccion);
                   this.cdr.detectChanges(); // Update popup view with legible location
              },
              error: () => {
                  this.avistamientoSeleccionado!.lugarDesaparicionLegible = avistamiento.ubicacion || 'Ubicación desconocida';
                  console.warn('[FORO] [POPUP] Falló geocodificación para popup.');
                  this.cdr.detectChanges();
              }
            });
        } else {
             this.avistamientoSeleccionado.lugarDesaparicionLegible = avistamiento.ubicacion || 'Ubicación no disponible';
             console.warn('[FORO] [POPUP] No hay coordenadas válidas para geocodificar en popup.');
        }
    }


    const coords = this.mapService.parsearCoords(avistamiento.ubicacion);

    if (coords) {
      console.log('[FORO] [POPUP] Coordenadas válidas encontradas:', coords, 'Renderizando mapa...');
      await this.renderizarMapaPopup(avistamiento, coords);
    } else {
      console.warn('[FORO] [POPUP] Coordenadas no válidas para el mapa:', avistamiento.ubicacion, 'No se mostrará el mapa.');
      this.mapError = 'Coordenadas no válidas para mostrar el mapa.';
      this.isLoadingMap = false;
      this.cdr.detectChanges();
    }
  }

  private async renderizarMapaPopup(avistamiento: Avistamiento, coords: [number, number]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
        console.warn('[FORO] [POPUP MAP] No se puede renderizar mapa: No es navegador.');
        this.isLoadingMap = false;
        this.mapError = 'La funcionalidad del mapa no está disponible en este entorno.';
         this.cdr.detectChanges();
        return;
    }

    console.log('[FORO] [POPUP MAP] Iniciando renderizado de mapa para ID:', avistamiento.idAvistamiento);

    // Pequeña pausa para asegurar que el DOM se ha actualizado y el div del mapa existe
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log('[FORO] [POPUP MAP] Pausa de 150ms completada.');


    const mapaId = 'mapaPopupA-' + avistamiento.idAvistamiento;
    const divMapa = document.getElementById(mapaId);

    if (!divMapa) {
        console.error(`[FORO] [POPUP MAP] ❌ Div del mapa no encontrado en el DOM: ${mapaId}`);
         this.isLoadingMap = false;
         this.mapError = `Error interno: Elemento del mapa no encontrado (${mapaId}). Asegúrate de que el popup está visible.`;
         this.cdr.detectChanges();
        return;
    }
     console.log(`[FORO] [POPUP MAP] ✅ Div del mapa encontrado: ${mapaId}`);

     // Asegurar que el div del mapa tiene tamaño (puede ser necesario si CSS es lento)
    divMapa.style.height = '400px'; // Asegura una altura mínima
    divMapa.style.width = '100%'; // Asegura un ancho
     console.log('[FORO] [POPUP MAP] Dimensiones del div del mapa aseguradas.');


    // Limpiar cualquier instancia de mapa existente para este ID
    if (this.mapas[mapaId]) {
       console.log(`[FORO] [POPUP MAP] Limpiando mapa existente para ${mapaId}`);
       // Usar MapService para eliminar
       this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map si MapService lo requiere
       delete this.mapas[mapaId];
       console.log(`[FORO] [POPUP MAP] Mapa existente para ${mapaId} limpiado.`);
    }

    try {
        // Usar el MapService para crear la instancia del mapa
        console.log('[FORO] [POPUP MAP] Creando nueva instancia de mapa via MapService...');
        // MapService debe encapsular L.map(...) y retornar L.Map o null/undefined
        const mapa = this.mapService.crearMapa(mapaId, coords);
        if (!mapa) {
             throw new Error('El MapService devolvió un mapa nulo al crearlo.');
        }
        this.mapas[mapaId] = mapa; // Guardar la instancia L.Map

        console.log('[FORO] [POPUP MAP] Añadiendo marcador via MapService...');
        // Usar el MapService para añadir el marcador
        this.mapService.agregarMarcador(
          mapa, // Pasar la instancia L.Map
          coords,
          'blue', // Color del marcador para avistamientos en foro
          'Lugar de avistamiento', // Título
          this.avistamientoSeleccionado?.lugarDesaparicionLegible || avistamiento.ubicacion || '' // Popup/Tooltip content
        );
        console.log('[FORO] [POPUP MAP] Marcador añadido.');

        // Forzar redibujado del mapa después de un breve retardo - crucial si está dentro de un popup/modal
        setTimeout(() => {
             const currentMap = this.mapas[mapaId];
             if (currentMap) { // Check if map still exists
                console.log('[FORO] [POPUP MAP] Llamando a invalidateSize...');
                currentMap.invalidateSize(); // Asegura que el mapa se renderice correctamente dentro del div
                console.log('[FORO] [POPUP MAP] ✅ Mapa renderizado y listo en el popup.');
                this.isLoadingMap = false;
                this.mapError = null; // Limpiar cualquier error previo del mapa
                 if (divMapa) divMapa.style.border = '2px solid green'; // Indicador visual de éxito
             } else {
                 console.warn('[FORO] [POPUP MAP] Mapa ya no existe al intentar llamar a invalidateSize.');
             }
           this.cdr.detectChanges(); // Ensure view updates after map load
        }, 100); // Un pequeño retraso es a menudo necesario

    } catch (error: any) {
        console.error('[FORO] [POPUP MAP] ❌ ERROR al renderizar mapa:', error);
         this.isLoadingMap = false;
         this.mapError = `Error al inicializar el mapa: ${error.message || 'Error desconocido'}`;
         if (divMapa) {
             divMapa.innerHTML = `
               <div style="color:red; padding:10px; text-align:center;">
                 <h4>Error al cargar el mapa</h4>
                 <p>${this.mapError}</p>
                 <p>Coordenadas: ${avistamiento.ubicacion || 'No disponibles'}</p>
                 <p>ID Elemento: ${mapaId}</p>
                 <p>Ver consola (F12) para más detalles.</p>
               </div>
             `;
             divMapa.style.border = '2px solid red'; // Indicador visual de error
         }
         this.cdr.detectChanges();
    }
  }


  cerrarPopup(): void {
    console.log('[FORO] [POPUP] Cerrando popup.');
    if (this.avistamientoSeleccionado) {
      const mapaId = 'mapaPopupA-' + this.avistamientoSeleccionado.idAvistamiento;
      if (this.mapas[mapaId]) {
         console.log(`[FORO] [POPUP] Limpiando mapa ${mapaId} al cerrar popup.`);
         // Usar MapService para eliminar
         this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map
         delete this.mapas[mapaId];
         console.log(`[FORO] [POPUP] Mapa ${mapaId} limpiado.`);
      }
    } else {
        console.log('[FORO] [POPUP] No hay avistamiento seleccionado, nada que limpiar.');
    }
    this.avistamientoSeleccionado = null; // Oculta el popup
    this.mapError = null; // Limpiar errores del mapa
    this.isLoadingMap = false; // Asegurar que el indicador de carga está off
     this.cdr.detectChanges(); // Ensure popup UI updates
    console.log('[FORO] [POPUP] Popup cerrado.');
  }

  // --- AÑADIR ESTE MÉTODO: Navegar a la página de edición ---
  irAEditarAvistamiento(idAvistamiento: number | undefined): void {
    if (idAvistamiento === undefined || idAvistamiento === null) {
        console.warn('[FORO] ⚠️ No se puede editar: ID de avistamiento es undefined o null.', idAvistamiento);
        return;
    }
    console.log(`[FORO] 🖱️ Clic en Editar para ID: ${idAvistamiento}. Navegando a /avistamientos/form/${idAvistamiento}`);
    // Navegar a la ruta del formulario con el ID del avistamiento
    this.router.navigate(['/avistamientos/form', idAvistamiento]);
  }
  // ----------------------------------------------------------


  // --- Método para limpiar todas las instancias de mapa (útil en ngOnDestroy) ---
  private limpiarTodosLosMapas(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    console.log('[FORO] [DESTROY] Limpiando todas las instancias de mapa...');
    for (const mapaId in this.mapas) {
      if (this.mapas[mapaId]) {
        console.log(`[FORO] [DESTROY] Limpiando mapa ${mapaId}...`);
         this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map
      }
    }
    this.mapas = {}; // Reset the map instances object
    console.log('[FORO] [DESTROY] Todas las instancias de mapa limpiadas.');
  }
  // ---------------------------------------------------------------------------
}