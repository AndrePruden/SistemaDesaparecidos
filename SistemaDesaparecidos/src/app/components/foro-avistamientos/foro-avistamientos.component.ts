import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvistamientoService, Avistamiento } from '../../services/avistamiento.service';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
import { UsuarioService } from '../../services/usuario.service';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-foro-avistamientos',
  standalone: true, 
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './foro-avistamientos.component.html',
  styleUrls: ['./foro-avistamientos.component.scss']
})

export class ForoAvistamientosComponent implements OnInit, OnDestroy {
  avistamientos: Avistamiento[] = [];
  avistamientosFiltrados: Avistamiento[] = [];
  avistamientoSeleccionado: Avistamiento | null = null;
  mapas: { [key: string]: L.Map | null } = {};
  nombreBusqueda = '';
  lugarBusqueda = '';
  fechaBusquedaInicio = '';
  fechaBusquedaFin = '';
  fechaMaxima: string = '';
  currentUserEmail: string | null = null;
  isLoadingMap = false;
  mapError: string | null = null;

  private readonly LIMITE_AVISTAMIENTOS = 8;

  private avistamientoChangeSubscription: Subscription | undefined;
  private authStateSubscription: Subscription | undefined;

  constructor(
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    public mapService: MapService,
    private router: Router,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('[FORO] Componente construido.');
  }

  ngOnInit(): void {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    this.fechaMaxima = ayer.toISOString().split('T')[0];
    console.log('[FORO] ngOnInit iniciado.');
    if (isPlatformBrowser(this.platformId)) {
      console.log('[FORO] Navegador detectado.');
      this.authStateSubscription = this.usuarioService.currentUserEmail$.subscribe(email => {
        console.log('[FORO] Estado de autenticación cambiado. Email actual:', email);
        this.currentUserEmail = email;
        this.cdr.detectChanges(); 
      });
      console.log('[FORO] ngOnInit: Valor inicial de currentUserEmail:', this.currentUserEmail); 
      this.obtenerAvistamientos();
      this.avistamientoChangeSubscription = this.avistamientoService.avistamientoCambiado$.subscribe(() => {
        console.log('[FORO] Cambio en avistamientos detectado (desde service). Recargando lista...');
        this.obtenerAvistamientos(); 
      });
    } else {
      console.warn('[FORO] No se ejecuta en navegador (SSR), omitiendo lógica.');
    }
  }

  ngOnDestroy(): void {
    console.log('[FORO] ngOnDestroy iniciado.');
    this.limpiarTodosLosMapas(); 
    if (this.avistamientoChangeSubscription) {
      console.log('[FORO] Desuscribiendo de avistamientoChangeSubscription');
      this.avistamientoChangeSubscription.unsubscribe();
    }
     if (this.authStateSubscription) {
         console.log('[FORO] Desuscribiendo de authStateSubscription');
         this.authStateSubscription.unsubscribe();
     }
     console.log('[FORO] ngOnDestroy finalizado.');
  }

  obtenerAvistamientos(): void {
    console.log('[FORO] [DATA] Solicitando todos los avistamientos...');
    this.avistamientoService.obtenerTodosLosAvistamientos().subscribe({
      next: (data: Avistamiento[]) => {
        console.log('[FORO] [DATA] Avistamientos cargados:', data.length, 'elementos.');
        this.avistamientos = data.filter(a => a.personaDesaparecida?.nombre);
        this.avistamientosFiltrados = this.avistamientos.slice(0, this.LIMITE_AVISTAMIENTOS);
        console.log('[FORO] [DATA] Avistamientos cargados en memoria:', this.avistamientos.length); 
        console.log('[FORO] [DATA] Avistamientos mostrados inicialmente:', this.avistamientosFiltrados.length, `(limitado a ${this.LIMITE_AVISTAMIENTOS})`); 
        this.setDireccionesAvistamientos(); 
         this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('[FORO] [ERROR] al obtener avistamientos:', err);
        this.avistamientos = [];
        this.cdr.detectChanges();
      }
    });
  }

  setDireccionesAvistamientos(): void {
    console.log('[FORO] [DATA] Iniciando geocodificación inversa para avistamientos...');
    this.avistamientos.forEach(avistamiento => {
      
      if (avistamiento.lugarDesaparicionLegible && avistamiento.lugarDesaparicionLegible !== '' && avistamiento.lugarDesaparicionLegible !== 'Cargando...') {
        return;
      }
      if (!avistamiento.lugarDesaparicionLegible) {
        avistamiento.lugarDesaparicionLegible = avistamiento.ubicacion || 'Cargando...';
      }
      const coords = this.mapService.parsearCoords(avistamiento.ubicacion);
      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => {
            avistamiento.lugarDesaparicionLegible = direccion;
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
        this.cdr.detectChanges();
      }
    });
    console.log('[FORO] [DATA] Proceso de geocodificación inversa iniciado.');
  }

  filtrarAvistamientos(): void {
    console.log('[FORO] [FILTRO] Aplicando filtros...');
    const resultadosFiltrados = this.avistamientos.filter(avistamiento => {
      const nombreAvistamiento = avistamiento.personaDesaparecida?.nombre || '';
      const nombreMatch = !this.nombreBusqueda ||
      nombreAvistamiento.toLowerCase().includes(this.nombreBusqueda.toLowerCase());
      const lugarAvistamientoTexto = avistamiento.lugarDesaparicionLegible || avistamiento.ubicacion || '';
      const lugarMatch = !this.lugarBusqueda ||
        lugarAvistamientoTexto.toLowerCase().includes(this.lugarBusqueda.toLowerCase());
      const fechaAvistamientoStr = avistamiento.fecha; 
      let fechaMatch = true;
      if (this.fechaBusquedaInicio || this.fechaBusquedaFin) {
        const fechaAvistamientoDate = fechaAvistamientoStr ? new Date(fechaAvistamientoStr + 'T00:00:00') : null; 
        const fechaInicioDate = this.fechaBusquedaInicio ? new Date(this.fechaBusquedaInicio + 'T00:00:00') : null;
        const fechaFinDate = this.fechaBusquedaFin ? new Date(this.fechaBusquedaFin + 'T23:59:59') : null; 
        if (!fechaAvistamientoDate || isNaN(fechaAvistamientoDate.getTime())) {
          fechaMatch = false;
        } else {
          fechaMatch =
            (!fechaInicioDate || fechaAvistamientoDate >= fechaInicioDate) &&
            (!fechaFinDate || fechaAvistamientoDate <= fechaFinDate);
        }
      }
      return nombreMatch && lugarMatch && fechaMatch;
    });
    
    this.avistamientosFiltrados = resultadosFiltrados.slice(0, this.LIMITE_AVISTAMIENTOS);
    console.log('[FORO] [FILTRO] Resultados encontrados:', resultadosFiltrados.length, 'de', this.avistamientos.length, 'total');
    console.log('[FORO] [FILTRO] Resultados mostrados:', this.avistamientosFiltrados.length, `(limitado a ${this.LIMITE_AVISTAMIENTOS})`);
    this.cdr.detectChanges(); 
  }

  limpiarFiltros(): void {
    console.log('[FORO] [FILTRO] Limpiando filtros...');
    this.nombreBusqueda = '';
    this.lugarBusqueda = '';
    this.fechaBusquedaInicio = '';
    this.fechaBusquedaFin = '';
    this.filtrarAvistamientos(); 
  }

  async mostrarPopup(avistamiento: Avistamiento): Promise<void> {
    console.log('[FORO] [POPUP] Mostrando popup para avistamiento ID:', avistamiento.idAvistamiento);
    this.avistamientoSeleccionado = { ...avistamiento }; 
    this.isLoadingMap = true;
    this.mapError = null; 
    this.cdr.detectChanges(); 
    if (!this.avistamientoSeleccionado.lugarDesaparicionLegible || this.avistamientoSeleccionado.lugarDesaparicionLegible === 'Cargando...') {
      console.log('[FORO] [POPUP] Lugar legible no disponible, intentando geocodificar para popup...');
      const coordsForPopup = this.mapService.parsearCoords(avistamiento.ubicacion);
      if (coordsForPopup) {
        console.log('[FORO] [POPUP] Geocodificando ubicación para popup...');
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coordsForPopup[0], coordsForPopup[1]).subscribe({
          next: direccion => {
            this.avistamientoSeleccionado!.lugarDesaparicionLegible = direccion;
            console.log('[FORO] [POPUP] Ubicación geocodificada para popup:', direccion);
            this.cdr.detectChanges(); 
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
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log('[FORO] [POPUP MAP] Pausa de 150ms completada.');
    const mapaId = 'mapaPopupA-' + avistamiento.idAvistamiento;
    const divMapa = document.getElementById(mapaId);
    if (!divMapa) {
      console.error(`[FORO] [POPUP MAP] Div del mapa no encontrado en el DOM: ${mapaId}`);
      this.isLoadingMap = false;
      this.mapError = `Error interno: Elemento del mapa no encontrado (${mapaId}). Asegúrate de que el popup está visible.`;
      this.cdr.detectChanges();
      return;
    }
    console.log(`[FORO] [POPUP MAP] Div del mapa encontrado: ${mapaId}`);
    divMapa.style.height = '400px'; 
    divMapa.style.width = '100%';
    console.log('[FORO] [POPUP MAP] Dimensiones del div del mapa aseguradas.');
    if (this.mapas[mapaId]) {
      console.log(`[FORO] [POPUP MAP] Limpiando mapa existente para ${mapaId}`);
      this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map si MapService lo requiere
      delete this.mapas[mapaId];
      console.log(`[FORO] [POPUP MAP] Mapa existente para ${mapaId} limpiado.`);
    }
    try {
      console.log('[FORO] [POPUP MAP] Creando nueva instancia de mapa via MapService...');
      const mapa = this.mapService.crearMapa(mapaId, coords);
      if (!mapa) {
        throw new Error('El MapService devolvió un mapa nulo al crearlo.');
      }
      this.mapas[mapaId] = mapa;
      console.log('[FORO] [POPUP MAP] Añadiendo marcador via MapService...');
      this.mapService.agregarMarcador(
        mapa, 
        coords,
        'blue', 
        'Lugar de avistamiento', 
        this.avistamientoSeleccionado?.lugarDesaparicionLegible || avistamiento.ubicacion || '' 
      );
      console.log('[FORO] [POPUP MAP] Marcador añadido.');
      setTimeout(() => {
        const currentMap = this.mapas[mapaId];
        if (currentMap) { 
          console.log('[FORO] [POPUP MAP] Llamando a invalidateSize...');
          currentMap.invalidateSize(); 
          console.log('[FORO] [POPUP MAP] Mapa renderizado y listo en el popup.');
          this.isLoadingMap = false;
          this.mapError = null; 
          if (divMapa) divMapa.style.border = '2px solid green'; 
          } else {
            console.warn('[FORO] [POPUP MAP] Mapa ya no existe al intentar llamar a invalidateSize.');
          }
          this.cdr.detectChanges(); 
        }
      , 100); 
    } catch (error: any) {
      console.error('[FORO] [POPUP MAP] ERROR al renderizar mapa:', error);
      this.isLoadingMap = false;
      this.mapError = `Error al inicializar el mapa: ${error.message || 'Error desconocido'}`;
      if (divMapa) {
        divMapa.innerHTML = `
          <div style="color:red; padding:10px; text-align:center;">
            <h4>Error al cargar el mapa</h4>
            <p>${this.mapError}</p>
            <p>Coordenadas: ${avistamiento.ubicacion || 'No disponibles'}</p>
            <p>ID Elemento: ${mapaId}</p>
          </div>
          `;
        divMapa.style.border = '2px solid red'; 
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
        this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); 
        delete this.mapas[mapaId];
        console.log(`[FORO] [POPUP] Mapa ${mapaId} limpiado.`);
      }
    } else {
      console.log('[FORO] [POPUP] No hay avistamiento seleccionado, nada que limpiar.');
    }
    this.avistamientoSeleccionado = null; 
    this.mapError = null; 
    this.isLoadingMap = false; 
    this.cdr.detectChanges(); 
    console.log('[FORO] [POPUP] Popup cerrado.');
  }

  irAEditarAvistamiento(idAvistamiento: number | undefined): void {
    console.log(`[FORO] 🖱️ Clic en Editar para ID: ${idAvistamiento}. Navegando a /avistamientos/form/${idAvistamiento}`);
    this.router.navigate(['/avistamientos/form', idAvistamiento]);
  }
  
  private limpiarTodosLosMapas(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    console.log('[FORO] [DESTROY] Limpiando todas las instancias de mapa...');
    for (const mapaId in this.mapas) {
      if (this.mapas[mapaId]) {
        console.log(`[FORO] [DESTROY] Limpiando mapa ${mapaId}...`);
         this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map); // Cast a L.Map
      }
    }
    this.mapas = {};
    console.log('[FORO] [DESTROY] Todas las instancias de mapa limpiadas.');
  }
}