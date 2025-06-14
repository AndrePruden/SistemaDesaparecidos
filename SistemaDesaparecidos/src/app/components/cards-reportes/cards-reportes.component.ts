import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService, Avistamiento } from '../../services/avistamiento.service';
import { RouterModule } from '@angular/router';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';

interface Reporte {
  imagen: string;
  idDesaparecido: number;
  nombre: string;
  edad: number;
  lugarDesaparicion: string;
  fechaDesaparicion: string;
  lugarDesaparicionLegible: string;
  ultimoAvistamiento?: Avistamiento | null;
  descripcion: string;
  estado: boolean;
  emailReportaje: string;
}

@Component({
  selector: 'app-cards-reportes',
  standalone: true,
  templateUrl: './cards-reportes.component.html',
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./cards-reportes.component.scss']
})

export class CardsReportesComponent implements OnInit, OnDestroy {
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  nombreBusqueda = '';
  edadBusqueda: number | null = null;
  lugarBusqueda = '';
  fechaBusqueda = '';
  fechaMaxima: string = '';
  mapas: { [key: string]: L.Map | null } = {};
  reporteSeleccionado: Reporte | null = null;
  emailUsuarioActual: string | null = null;
  private avistamientoChangeSubscription: Subscription | undefined;

  totalReportesActivos = 0;
  reportesUltimaSemanaActivos = 0;
  zonasMasReportesActivos: { lugar: string, count: number }[] = [];
  isLoadingStats = true;

  minEdadActivos: number | null = null;
  maxEdadActivos: number | null = null;

  nombresReportesActivos: string[] = [];
  readonly maxNombresToList = 5;

  autorFiltro: string = 'todos';
  estadoFiltro: string = 'activos';

  constructor(
    private reportesService: ReportesService,
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
    console.log('[CARDS] Componente construido.');
    if (isPlatformBrowser(this.platformId)) {
      this.emailUsuarioActual = localStorage.getItem('email');
      console.log('[CARDS] Email de usuario actual (desde localStorage):', this.emailUsuarioActual);
    }
  }

  ngOnInit(): void {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    this.fechaMaxima = ayer.toISOString().split('T')[0];

    console.log('[CARDS] ngOnInit iniciado.');
    if (isPlatformBrowser(this.platformId)) {
      console.log('[CARDS] Navegador detectado.');
      this.obtenerReportes();

      this.avistamientoChangeSubscription = this.avistamientoService.avistamientoCambiado$.subscribe(() => {
         console.log('[CARDS] Cambio en avistamientos detectado (desde service). Recargando reportes y recalculando stats...');
         this.obtenerReportes();
         this.cdr.detectChanges();
      });
    } else {
        console.warn('[CARDS] No se ejecuta en navegador (SSR), omitiendo lógica.');
    }
  }

  ngOnDestroy(): void {
    console.log('[CARDS] ngOnDestroy iniciado.');
    if (this.avistamientoChangeSubscription) {
      console.log('[CARDS] Desuscribiendo de avistamientoChangeSubscription');
      this.avistamientoChangeSubscription.unsubscribe();
    }
    this.limpiarTodosLosMapas();
    console.log('[CARDS] ngOnDestroy finalizado.');
  }

  obtenerReportes(): void {
    this.isLoadingStats = true;
    console.log('[CARDS] [DATA] Solicitando todos los reportes...');
    this.reportesService.obtenerReportes().subscribe(
      (data: Reporte[]) => {
        console.log('[CARDS] [DATA] Reportes cargados (crudos):', data.length, 'elementos.');

        const emailUsuario = this.emailUsuarioActual;
        this.reportes = data.filter(reporte =>
          reporte.estado === true || (emailUsuario !== null && reporte.emailReportaje === emailUsuario)
        );
        console.log('[CARDS] [DATA] Reportes para cards (activos O mis archivados):', this.reportes.length, 'elementos.');

        this.reportesFiltrados = [...this.reportes];
        console.log('[CARDS] [DATA] Reportes filtrados inicializados.');

        this.setDireccionesReportes(this.reportes);
        this.cargarUltimosAvistamientos(this.reportes);

        const reportesActivosPuros = data.filter(r => r.estado === true);
        this.calcularEstadisticas(reportesActivosPuros);

        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
      (err) => {
          console.error('[CARDS] [ERROR] al obtener reportes:', err);
           this.reportes = [];
           this.reportesFiltrados = [];
           this.isLoadingStats = false;
           this.cdr.detectChanges();
           this.totalReportesActivos = 0;
           this.reportesUltimaSemanaActivos = 0;
           this.zonasMasReportesActivos = [];
           this.nombresReportesActivos = [];
           this.minEdadActivos = null;
           this.maxEdadActivos = null;
      }
    );
  }

  calcularEstadisticas(reportesActivos: Reporte[]): void {
      console.log('[CARDS] Calculando estadísticas sobre', reportesActivos.length, 'reportes activos.');
    if (!reportesActivos || reportesActivos.length === 0) {
      this.totalReportesActivos = 0;
      this.reportesUltimaSemanaActivos = 0;
      this.zonasMasReportesActivos = [];
      this.nombresReportesActivos = [];
      this.minEdadActivos = null;
      this.maxEdadActivos = null;
      console.log('[CARDS] No hay reportes activos para calcular estadísticas.');
      return;
    }

    this.totalReportesActivos = reportesActivos.length;

    if (this.totalReportesActivos > 0 && this.totalReportesActivos <= this.maxNombresToList) {
        this.nombresReportesActivos = reportesActivos.filter(r => r.nombre).map(r => r.nombre);
    } else {
        this.nombresReportesActivos = [];
    }

    const hoy = new Date();
    const haceUnaSemana = new Date(hoy);
    haceUnaSemana.setDate(hoy.getDate() - 7);
    haceUnaSemana.setHours(0, 0, 0, 0);

    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);

    this.reportesUltimaSemanaActivos = reportesActivos.filter(reporte => {
      const fechaReporte = new Date(reporte.fechaDesaparicion);
       return fechaReporte >= haceUnaSemana && fechaReporte <= finHoy;
    }).length;

    const edadesValidas = reportesActivos
        .map(r => r.edad)
        .filter(edad => typeof edad === 'number' && edad > 0);

    if (edadesValidas.length > 0) {
        this.minEdadActivos = Math.min(...edadesValidas);
        this.maxEdadActivos = Math.max(...edadesValidas);
    } else {
        this.minEdadActivos = null;
        this.maxEdadActivos = null;
    }

    const conteoZonas: { [key: string]: number } = {};
    reportesActivos.forEach(reporte => {
       const lugar = reporte.lugarDesaparicionLegible && !['Cargando...', 'Ubicación desconocida', 'Ubicación no disponible', ''].includes(reporte.lugarDesaparicionLegible)
           ? reporte.lugarDesaparicionLegible
           : (reporte.lugarDesaparicion || 'Lugar no especificado');
       if (lugar && lugar !== 'Lugar no especificado' && lugar !== 'Ubicación no disponible') {
            conteoZonas[lugar] = (conteoZonas[lugar] || 0) + 1;
       }
    });

    this.zonasMasReportesActivos = Object.keys(conteoZonas)
      .map(key => ({ lugar: key, count: conteoZonas[key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

       console.log('[CARDS] Estadísticas calculadas:', {
           totalReportesActivos: this.totalReportesActivos,
           nombresReportesActivos: this.nombresReportesActivos,
           reportesUltimaSemanaActivos: this.reportesUltimaSemanaActivos,
           minEdadActivos: this.minEdadActivos,
           maxEdadActivos: this.maxEdadActivos,
           zonasMasReportesActivos: this.zonasMasReportesActivos
       });
  }


  setDireccionesReportes(reporteList: Reporte[]): void {
      console.log('[CARDS] [DATA] Iniciando geocodificación inversa para', reporteList.length, 'reportes.');
    reporteList.forEach(reporte => {
      if (reporte.lugarDesaparicionLegible && !['Cargando...', 'Ubicación desconocida', 'Ubicación no disponible', ''].includes(reporte.lugarDesaparicionLegible)) {
          return;
      }
       if (!reporte.lugarDesaparicionLegible || reporte.lugarDesaparicionLegible === '' || reporte.lugarDesaparicionLegible === 'Ubicación desconocida') {
           reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Cargando...';
       }

      const coords = this.mapService.parsearCoords(reporte.lugarDesaparicion);
      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => {
            reporte.lugarDesaparicionLegible = direccion;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.warn(`[CARDS] [DATA] Error geocodificando coords ${coords} para reporte ${reporte.idDesaparecido}:`, err.message || 'Unknown Error');
            reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Ubicación desconocida';
            this.cdr.detectChanges();
          }
        });
      } else {
        console.warn(`[CARDS] [DATA] No hay coords válidas para geocodificar reporte ${reporte.idDesaparecido}:`, reporte.lugarDesaparicion);
        reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Ubicación no disponible';
        this.cdr.detectChanges();
      }
    });
     console.log('[CARDS] [DATA] Proceso de geocodificación inversa iniciado.');
  }

  cargarUltimosAvistamientos(reporteList: Reporte[]): void {
    console.log('[CARDS] [DATA] Cargando últimos avistamientos para', reporteList.length, 'reportes...');
    reporteList.forEach(reporte => {
      if (reporte.idDesaparecido !== null && reporte.idDesaparecido !== undefined) {
         this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).subscribe({
        next: (avistamiento: Avistamiento | null) => {
          reporte.ultimoAvistamiento = avistamiento;
           this.cdr.detectChanges();

           if (this.reporteSeleccionado && this.reporteSeleccionado.idDesaparecido === reporte.idDesaparecido) {
            console.log(`[CARDS] [DATA] Popup abierto para reporte ${reporte.idDesaparecido}. Actualizando popup y mapa.`);
            this.reporteSeleccionado.ultimoAvistamiento = avistamiento;
            const coordsDesaparicion = this.mapService.parsearCoords(reporte.lugarDesaparicion);
            if(coordsDesaparicion){
              console.log('[CARDS] [DATA] Re-renderizando mapa del popup con nuevo último avistamiento...');
              const mapaId = 'mapaPopup-' + this.reporteSeleccionado.idDesaparecido;
              if (this.mapas[mapaId]) {
                this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map);
                this.mapas[mapaId] = null;
              }
              this.renderizarMapa(this.reporteSeleccionado, coordsDesaparicion).catch(err => console.error("Error re-renderizando mapa de popup", err));
            } else {
              console.warn('[CARDS] [DATA] No se pudo re-renderizar mapa del popup: Coordenadas de desaparición inválidas.');
            }
          }
        },
        error: (err) => {
          console.error(`[CARDS] [ERROR] al obtener último avistamiento para reporte ${reporte.idDesaparecido}:`, err);
          reporte.ultimoAvistamiento = null;
          this.cdr.detectChanges();
        }
      });
    } else {
      console.warn('[CARDS] [DATA] Reporte sin idDesaparecido, no se puede cargar último avistamiento.', reporte);
    }
  });
    console.log('[CARDS] [DATA] Proceso de carga de últimos avistamientos iniciado.');
}

  async mostrarPopup(reporte: Reporte): Promise<void> {
    console.log('[CARDS] [POPUP] Mostrando popup para reporte ID:', reporte.idDesaparecido);
     this.reporteSeleccionado = { ...reporte };
    this.cdr.detectChanges();

    const coordsDesaparicion = this.mapService.parsearCoords(reporte.lugarDesaparicion);

    if (coordsDesaparicion) {
        console.log('[CARDS] [POPUP] Coordenadas de desaparición válidas, iniciando renderizado de mapa...');
        await this.renderizarMapa(this.reporteSeleccionado, coordsDesaparicion);
    } else {
        console.warn('[CARDS] [POPUP] Coordenadas de desaparición no válidas:', reporte.lugarDesaparicion, 'No se mostrará el mapa de desaparición.');
    }
  }


  private async renderizarMapa(reporte: Reporte, coordsDesaparicion: [number, number]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
         console.warn('[CARDS] [POPUP MAP] No se puede renderizar mapa: No es entorno de navegador.');
         return;
    }
    console.log('[CARDS] [POPUP MAP] Iniciando renderizado de mapa para ID:', reporte.idDesaparecido);

    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('[CARDS] [POPUP MAP] Pausa completada.');

    const mapaId = 'mapaPopup-' + reporte.idDesaparecido;
    const divMapa = document.getElementById(mapaId);

    if (!divMapa) {
        console.error(`[CARDS] [POPUP MAP] Div del mapa no encontrado en el DOM: #${mapaId}.`);
        return;
    }
     console.log(`[CARDS] [POPUP MAP] Div del mapa encontrado: #${mapaId}`);

    divMapa.style.height = '400px';
    divMapa.style.width = '100%';
     console.log('[CARDS] [POPUP MAP] Dimensiones del div del mapa aseguradas.');


    if (this.mapas[mapaId]) {
        console.log(`[CARDS] [POPUP MAP] Limpiando mapa existente para ${mapaId}.`);
        this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map);
        this.mapas[mapaId] = null;
        console.log(`[CARDS] [POPUP MAP] Mapa existente para ${mapaId} limpiado.`);
    }

    try {
         console.log('[CARDS] [POPUP MAP] Creando nueva instancia de mapa via MapService...');
         const mapa = this.mapService.crearMapa(mapaId, coordsDesaparicion);
         if (!mapa) {
             throw new Error('MapService devolvió un mapa nulo al crearlo. Posiblemente un error en el servicio.');
         }
         this.mapas[mapaId] = mapa;


         console.log('[CARDS] [POPUP MAP] Añadiendo marcador de desaparición...');
         this.mapService.agregarMarcador(
           mapa,
           coordsDesaparicion,
           'red',
           'Lugar de desaparición',
           reporte?.lugarDesaparicionLegible || reporte.lugarDesaparicion || ''
         );
         console.log('[CARDS] [POPUP MAP] Marcador de desaparición añadido.');


         let coordsAvistamiento: [number, number] | null = null;

         if (reporte?.ultimoAvistamiento?.ubicacion) {
           coordsAvistamiento = this.mapService.parsearCoords(
             reporte.ultimoAvistamiento.ubicacion
           );
           if (coordsAvistamiento) {
               console.log('[CARDS] [POPUP MAP] Coordenadas de último avistamiento válidas. Añadiendo marcador...');
             this.mapService.agregarMarcador(
               mapa,
               coordsAvistamiento,
               'blue',
               'Último avistamiento',
               `Fecha: ${new Date(reporte.ultimoAvistamiento.fecha).toLocaleDateString()} ${new Date(reporte.ultimoAvistamiento.fecha).toLocaleTimeString()} <br> Detalles: ${reporte.ultimoAvistamiento.descripcion || 'No hay detalles adicionales'}`
             );
              console.log('[CARDS] [POPUP MAP] Marcador de último avistamiento añadido.');
           } else {
               console.warn('[CARDS] [POPUP MAP] Coordenadas de último avistamiento no válidas:', reporte.ultimoAvistamiento.ubicacion);
           }
         } else {
             console.log('[CARDS] [POPUP MAP] No hay último avistamiento o no tiene ubicación válida para mostrar en mapa para reporte ID:', reporte.idDesaparecido);
         }

          if (coordsAvistamiento) {
             console.log('[CARDS] [POPUP MAP] Ajustando vista para ambos marcadores...');
             this.mapService.ajustarVista(mapa, coordsDesaparicion, coordsAvistamiento);
         } else {
              console.log('[CARDS] [POPUP MAP] Ajustando vista solo para el marcador de desaparición.');
              mapa.setView(coordsDesaparicion, mapa.getZoom() > 10 ? mapa.getZoom() : 13);
         }

         setTimeout(() => {
           const currentMap = this.mapas[mapaId];
           if(currentMap){
              console.log('[CARDS] [POPUP MAP] Llamando a invalidateSize...');
              currentMap.invalidateSize();
              console.log('[CARDS] [POPUP MAP] ✅ Mapa renderizado y listo en el popup.');
           } else {
               console.warn('[CARDS] [POPUP MAP] Mapa ya no existe al intentar llamar a invalidateSize.');
           }
           this.cdr.detectChanges();
         }, 100);

    } catch (error: any) {
        console.error('[CARDS] [POPUP MAP] ERROR FATAL al renderizar mapa:', error);
         const errorDiv = document.createElement('div');
         errorDiv.style.color = '#c62828';
         errorDiv.style.padding = '20px';
         errorDiv.style.textAlign = 'center';
         errorDiv.style.backgroundColor = '#ffcdd2';
         errorDiv.innerHTML = `<h4>Error al cargar el mapa</h4><p>${error.message || 'Error desconocido al inicializar el mapa.'}</p><p>Coordenadas: ${reporte.lugarDesaparicion || 'No disponibles'}</p><p>Ver consola (F12) para más detalles técnicos.</p>`;
         if (divMapa) {
             divMapa.innerHTML = '';
             divMapa.appendChild(errorDiv);
             divMapa.style.border = '2px solid #c62828';
         }
         this.cdr.detectChanges();
    }
  }

  cerrarPopup(): void {
    console.log('[CARDS] [POPUP] Cerrando popup.');
    if (this.reporteSeleccionado) {
      const mapaId = 'mapaPopup-' + this.reporteSeleccionado.idDesaparecido;
      if (this.mapas[mapaId]) {
         console.log(`[CARDS] [POPUP] Limpiando mapa ${mapaId} al cerrar popup.`);
         this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map);
         this.mapas[mapaId] = null;
         console.log(`[CARDS] [POPUP] Mapa ${mapaId} limpiado.`);
      }
    } else {
        console.log('[CARDS] [POPUP] No hay reporte seleccionado, nada que limpiar.');
    }
    this.reporteSeleccionado = null;
    this.cdr.detectChanges();
    console.log('[CARDS] [POPUP] Popup cerrado.');
  }

  private limpiarTodosLosMapas(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    console.log('[CARDS] [DESTROY] Limpiando todas las instancias de mapa...');
    for (const mapaId in this.mapas) {
      if (this.mapas[mapaId]) {
        console.log(`[CARDS] [DESTROY] Limpiando mapa ${mapaId}...`);
         this.mapService.eliminarMapa(this.mapas[mapaId] as L.Map);
         this.mapas[mapaId] = null;
      }
    }
    this.mapas = {};
    console.log('[CARDS] [DESTROY] Todas las instancias de mapa limpiadas.');
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/470100848/es/vector/macho-icono-de-perfil-blanco-en-fondo-azul.jpg?s=612x612&w=0&k=20&c=HVwuxvS7hDgG6qOZXRXvsHbLVRKP5zrIllm09LWMgjc=';
  }

  puedeArchivar(reporte: Reporte): boolean {
     return this.emailUsuarioActual !== null && this.emailUsuarioActual === reporte.emailReportaje && reporte.estado === true;
  }

  archivarReporte(id: number): void {
      console.log('[CARDS] Intentando archivar reporte ID:', id);
      if (this.emailUsuarioActual === null) {
          console.warn('[CARDS] No se puede archivar: Usuario no logueado o email no disponible.');
           this.snackBar.open('Debes iniciar sesión para archivar reportes.', 'Cerrar', { duration: 3000 });
           return;
      }
        const reporteToArchive = this.reportes.find(r => r.idDesaparecido === id);
       if (!reporteToArchive) {
            console.warn('[CARDS] No se puede archivar: Reporte no encontrado en la lista local.');
             this.snackBar.open('No se encontró el reporte para archivar.', 'Cerrar', { duration: 3000 });
            return;
       }
        if (reporteToArchive.emailReportaje !== this.emailUsuarioActual) {
            console.warn('[CARDS] No se puede archivar: El usuario actual no creó este reporte.');
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
      data: { mensaje: '¿Estás seguro de archivar este reporte? Al archivar, ya no aparecerá en la lista pública de reportes activos, pero tú seguirás viéndolo en tu lista.' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
          console.log('[CARDS] Confirmación de archivo recibida. Llamando a ReportesService...');
        this.reportesService.archivarReporte(id).subscribe({
          next: (response) => {
            console.log('[CARDS] ✅ Reporte archivado con éxito:', response);
            this.snackBar.open('Reporte archivado con éxito', 'Cerrar', { duration: 3000 });
             this.obtenerReportes();
          },
          error: (err) => {
            console.error('[CARDS] ❌ Error al archivar el reporte:', err);
             const errorMessage = err.error?.message || err.message || 'Error desconocido al archivar';
            this.snackBar.open(`Error al archivar el reporte: ${errorMessage}`, 'Cerrar', { duration: 5000 });
          }
        });
      } else {
          console.log('[CARDS] Archivo cancelado por el usuario.');
      }
    });
  }

  filtrarReportes(): void {
    console.log('[CARDS] [FILTRO] Aplicando filtros...');
     this.reportesFiltrados = this.reportes.filter(reporte => {
      const nombreMatch = !this.nombreBusqueda ||
        reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());

      const edadMatch = this.edadBusqueda === null || this.edadBusqueda === undefined ||
        reporte.edad === this.edadBusqueda;

       const lugarReporteTexto = reporte.lugarDesaparicionLegible && !['Cargando...', 'Ubicación desconocida', 'Ubicación no disponible', ''].includes(reporte.lugarDesaparicionLegible)
        ? reporte.lugarDesaparicionLegible
        : (reporte.lugarDesaparicion || '');

      const lugarMatch = !this.lugarBusqueda ||
        lugarReporteTexto.toLowerCase().includes(this.lugarBusqueda.toLowerCase());

       const fechaReporteStr = reporte.fechaDesaparicion;
    this.reportesFiltrados = this.reportes.filter(reporte => {
      // Filtro por nombre
      const nombreMatch = !this.nombreBusqueda ||
        reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());

      // Filtro por edad
      const edadMatch = this.edadBusqueda === null ||
        reporte.edad === this.edadBusqueda;

      // Filtro por lugar
      const lugarReporteTexto = reporte.lugarDesaparicionLegible && reporte.lugarDesaparicionLegible !== '' ? reporte.lugarDesaparicionLegible : (reporte.lugarDesaparicion || '');
      const lugarMatch = !this.lugarBusqueda ||
        lugarReporteTexto.toLowerCase().includes(this.lugarBusqueda.toLowerCase());

      // Filtro por fecha
      const fechaReporteStr = reporte.fechaDesaparicion;
      const fechaMatch = !this.fechaBusqueda ||
         (fechaReporteStr && fechaReporteStr.startsWith(this.fechaBusqueda));

      // Filtro por autor
      let autorMatch = true;
      if (this.autorFiltro === 'mios') {
        autorMatch = this.emailUsuarioActual !== null && reporte.emailReportaje === this.emailUsuarioActual;
      }

      // Filtro por estado
      let estadoMatch = true;
      if (this.estadoFiltro === 'activos') {
        estadoMatch = reporte.estado === true;
      } else if (this.estadoFiltro === 'archivados') {
        estadoMatch = reporte.estado === false;
      }

      return nombreMatch && edadMatch && lugarMatch && fechaMatch && autorMatch && estadoMatch;
    });
     console.log('[CARDS] [FILTRO] Resultados filtrados:', this.reportesFiltrados.length);
    console.log('[CARDS] [FILTRO] Resultados filtrados:', this.reportesFiltrados.length);

    this.cdr.detectChanges(); // Force detection after filtering
  }

     this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    console.log('[CARDS] [FILTRO] Limpiando filtros...');
    this.nombreBusqueda = '';
    this.edadBusqueda = null;
    this.lugarBusqueda = '';
    this.fechaBusqueda = '';
    this.filtrarReportes();
  }
}