// estadisticas.component.ts
import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.heat';

import { ReportesService } from '../../services/reportes.service';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
import { AvistamientoService, Avistamiento } from '../../services/avistamiento.service';


import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

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

interface ZonaFrecuente {
  key: string;
  cantidad: number;
  lat: number;
  lng: number;
  label: string;
}

interface CoordenadaAgrupada {
    lat: number;
    lng: number;
    cantidad: number;
}


@Component({
  selector: 'app-estadisticas',
  standalone: true,
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss'],
  imports: [CommonModule, HeaderComponent, FooterComponent]
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  mapa: L.Map | null = null;

  totalReportesActivos = 0;
  reportesUltimaSemanaActivos = 0;
  zonasMasReportesActivos: { lugar: string, count: number }[] = [];
  isLoadingStats = true;
  minEdadActivos: number | null = null;
  maxEdadActivos: number | null = null;
  nombresReportesActivos: string[] = [];
  readonly maxNombresToList = 5;

  totalReportes: number = 0;
  zonasTotales: number = 0;
  densidadPromedio: number = 0;
  zonasFrecuentes: ZonaFrecuente[] = [];

  private allReports: Reporte[] = [];


  constructor(
    private reportesService: ReportesService,
    private geocodificacionService: GeocodificacionService,
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.cargarDatosYEstadisticas(), 500);
    }
  }

  ngOnDestroy(): void {
      console.log('[ESTADISTICAS] ngOnDestroy iniciado.');
      if (isPlatformBrowser(this.platformId) && this.mapa) {
           console.log('[ESTADISTICAS] Limpiando instancia de mapa principal...');
           this.mapService.eliminarMapa(this.mapa);
           this.mapa = null;
           console.log('[ESTADISTICAS] Instancia de mapa principal limpiada.');
      }
       console.log('[ESTADISTICAS] ngOnDestroy finalizado.');
  }


  cargarDatosYEstadisticas(): void {
      if (!isPlatformBrowser(this.platformId)) {
          console.warn('[ESTADISTICAS] No es entorno de navegador, omitiendo carga de datos.');
          return;
      }
       console.log('[ESTADISTICAS] Iniciando carga de datos y cálculo de estadísticas.');
      this.isLoadingStats = true;
      this.cdr.detectChanges();

      const contenedor = document.getElementById('mapa-estadisticas');
      if (!contenedor) {
        console.error('[ESTADISTICAS] Contenedor de mapa no encontrado');
        this.isLoadingStats = false;
        this.cdr.detectChanges();
        return;
      }

      contenedor.style.height = '500px';
      contenedor.style.width = '100%';

      const centroInicial: [number, number] = [-17.3935, -66.1570];
      if (!this.mapa) {
          this.mapa = this.mapService.crearMapa('mapa-estadisticas', centroInicial);
          console.log('[ESTADISTICAS] Mapa inicializado con centro por defecto.');
      }


      this.reportesService.obtenerReportes().subscribe(
          (allReports: Reporte[]) => {
              console.log('[ESTADISTICAS] Datos de reportes cargados (todos):', allReports.length, 'elementos.');
              this.allReports = allReports;
              this.totalReportes = allReports.length;


              const activeReports = allReports.filter(r => r.estado === true);
              console.log('[ESTADISTICAS] Reportes activos:', activeReports.length);

              this.setDireccionesReportes(activeReports);

              this.calcularEstadisticas(activeReports);


              const coordenadasValidas = allReports
                 .map(reporte => this.mapService.parsearCoords(reporte.lugarDesaparicion))
                 .filter((c): c is [number, number] => c !== null);

               console.log('[ESTADISTICAS] Coordenadas válidas para mapa (de todos los reportes):', coordenadasValidas.length);

               const coordenadasAgrupadas: CoordenadaAgrupada[] = coordenadasValidas.map(c => ({ lat: c[0], lng: c[1], cantidad: 1 }));
               const zonasGroupedMap = this.agruparPorZona(coordenadasAgrupadas, 2);
               this.zonasTotales = zonasGroupedMap.size;

               let sumaCantidadZonas = 0;
               zonasGroupedMap.forEach(z => sumaCantidadZonas += z.cantidad);
               this.densidadPromedio = zonasGroupedMap.size > 0 ? parseFloat((sumaCantidadZonas / zonasGroupedMap.size).toFixed(2)) : 0;


               const heatData: [number, number, number][] = coordenadasValidas.map(coord => [coord[0], coord[1], 5]);

                if(this.mapa && heatData.length > 0) {
                    if ((window as any).L && (window as any).L.heatLayer) {
                         const heatLayer = (window as any).L.heatLayer(heatData, {
                             radius: 20,
                             blur: 10,
                             maxZoom: 17,
                             gradient: {
                                 0.2: 'blue',
                                 0.4: 'lime',
                                 0.6: 'orange',
                                 0.8: 'red'
                             }
                         });
                         this.mapa.eachLayer(layer => {
                             if ((layer as any)._heat || (layer as any)._isGroupedMarker) {
                                 this.mapa?.removeLayer(layer);
                             }
                         });
                         heatLayer.addTo(this.mapa);
                         console.log('[ESTADISTICAS] Heatmap layer añadido.');

                           zonasGroupedMap.forEach((zona) => {
                             const marker = L.circleMarker([zona.lat, zona.lng], {
                               radius: 2,
                               color: 'transparent',
                               fillOpacity: 0,
                               interactive: true
                             } as L.CircleMarkerOptions);
                              (marker as any)._isGroupedMarker = true;

                             marker.bindTooltip(`Reportes: ${zona.cantidad}`, {
                               permanent: false,
                               direction: 'top'
                             });

                             marker.addTo(this.mapa!);
                           });
                           console.log('[ESTADISTICAS] Tooltips para zonas agrupadas añadidos.');


                     } else {
                         console.error('[ESTADISTICAS] leaflet.heat no está disponible. Asegúrate de que el script está cargado.');
                     }
                } else if (this.mapa) {
                     console.log('[ESTADISTICAS] No hay datos de coordenadas válidas para el heatmap.');
                }


               const zonasOrdenadasMapa = Array.from(zonasGroupedMap.values()).sort((a, b) => b.cantidad - a.cantidad);
               this.zonasFrecuentes = zonasOrdenadasMapa.slice(0, 3).map(z => {
                 const label = `Zona cercana a (${z.lat.toFixed(2)}, ${z.lng.toFixed(2)})`;
                 return {
                   key: `${z.lat},${z.lng}`,
                   cantidad: z.cantidad,
                   lat: z.lat,
                   lng: z.lng,
                   label
                 };
               });
                console.log('[ESTADISTICAS] Top 3 zonas (mapa) calculado:', this.zonasFrecuentes.length);

                if(this.mapa && coordenadasValidas.length > 0) {
                    const bounds = L.latLngBounds(coordenadasValidas.map(c => L.latLng(c[0], c[1])));
                     if (bounds.isValid()) {
                         this.mapa.fitBounds(bounds, { padding: [50, 50] });
                         console.log('[ESTADISTICAS] Vista del mapa ajustada a datos.');
                     } else {
                          console.warn('[ESTADISTICAS] Bounds calculados no son válidos. Centrando en default.');
                          this.mapa.setView(centroInicial, 10);
                     }
                } else if (this.mapa) {
                      this.mapa.setView(centroInicial, 10);
                      console.log('[ESTADISTICAS] No hay coordenadas para ajustar vista, centrando en default.');
                }


               this.isLoadingStats = false;
               this.cdr.detectChanges();

           },
           error => {
               console.error('[ESTADISTICAS] Error al obtener reportes para estadísticas:', error);
                this.isLoadingStats = false;
                this.cdr.detectChanges();
                this.allReports = [];
                this.totalReportes = 0;
                this.totalReportesActivos = 0;
                this.reportesUltimaSemanaActivos = 0;
                this.zonasMasReportesActivos = [];
                this.minEdadActivos = null;
                this.maxEdadActivos = null;
                this.nombresReportesActivos = [];
                this.zonasTotales = 0;
                this.densidadPromedio = 0;
                this.zonasFrecuentes = [];
                if(this.mapa) {
                    const divMapa = document.getElementById('mapa-estadisticas');
                    if(divMapa) {
                         divMapa.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error al cargar datos para las estadísticas y el mapa.</p>';
                         this.mapa.eachLayer(layer => {
                              this.mapa?.removeLayer(layer);
                         });
                         this.mapService.añadirCapaBase(this.mapa);
                    }
                }
           }
       );
   }


  calcularEstadisticas(reportesActivos: Reporte[]): void {
      console.log('[ESTADISTICAS] Calculando estadísticas de awareness sobre', reportesActivos.length, 'reportes activos.');
    if (!reportesActivos || reportesActivos.length === 0) {
      this.totalReportesActivos = 0;
      this.reportesUltimaSemanaActivos = 0;
      this.zonasMasReportesActivos = [];
      this.nombresReportesActivos = [];
      this.minEdadActivos = null;
      this.maxEdadActivos = null;
      console.log('[ESTADISTICAS] No hay reportes activos para calcular estadísticas de awareness.');
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

       console.log('[ESTADISTICAS] Estadísticas de awareness calculadas:', {
           totalReportesActivos: this.totalReportesActivos,
           nombresReportesActivos: this.nombresReportesActivos,
           reportesUltimaSemanaActivos: this.reportesUltimaSemanaActivos,
           minEdadActivos: this.minEdadActivos,
           maxEdadActivos: this.maxEdadActivos,
           zonasMasReportesActivos: this.zonasMasReportesActivos
       });
       this.cdr.detectChanges();
  }


   setDireccionesReportes(reporteList: Reporte[]): void {
       console.log('[ESTADISTICAS] [DATA] Iniciando geocodificación inversa para', reporteList.length, 'reportes activos...');
     reporteList.forEach(reporte => {
       if (reporte.lugarDesaparicionLegible && !['Cargando...', 'Ubicación desconocida', 'Ubicación no disponible', ''].includes(reporte.lugarDesaparicionLegible)) {
           return;
       }
        if (!reporte.lugarDesaparicionLegible || reporte.lugarDesaparicionLegible === '' || reporte.lugarDesaparicionLegible === 'Ubicación desconocida') {
            reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Cargando...';
             this.cdr.detectChanges();
        }

       const coords = this.mapService.parsearCoords(reporte.lugarDesaparicion);
       if (coords) {
         this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
           next: direccion => {
             reporte.lugarDesaparicionLegible = direccion;
             console.log(`[ESTADISTICAS] Geocodificación completa para reporte ${reporte.idDesaparecido}: ${direccion}`);
              this.cdr.detectChanges();
           },
           error: (err) => {
             console.warn(`[ESTADISTICAS] [DATA] Error geocodificando coords ${coords} para reporte ${reporte.idDesaparecido}:`, err.message || 'Unknown Error');
             reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Ubicación desconocida';
             this.cdr.detectChanges();
           }
         });
       } else {
         console.warn(`[ESTADISTICAS] [DATA] No hay coords válidas para geocodificar reporte ${reporte.idDesaparecido}:`, reporte.lugarDesaparicion);
         reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion || 'Ubicación no disponible';
         this.cdr.detectChanges();
       }
     });
      console.log('[ESTADISTICAS] [DATA] Proceso de geocodificación inversa iniciado (asíncrono).');
   }


  private agruparPorZona(
    coordenadas: { lat: number; lng: number }[],
    precision: number = 2
  ): Map<string, { lat: number; lng: number; cantidad: number }> {
    const zonas = new Map<string, { lat: number; lng: number; cantidad: number }>();

    for (const coord of coordenadas) {
      const lat = parseFloat(coord.lat.toFixed(precision));
      const lng = parseFloat(coord.lng.toFixed(precision));
      const key = `${lat},${lng}`;

      if (!zonas.has(key)) {
        zonas.set(key, { lat, lng, cantidad: 1 });
      } else {
        zonas.get(key)!.cantidad += 1;
      }
    }

    return zonas;
  }

  centrarEnZona(lat: number, lng: number): void {
    if (this.mapa) {
      this.mapa.setView([lat, lng], 16);
      console.log(`[ESTADISTICAS] Centrando mapa en [${lat}, ${lng}]`);
    } else {
        console.warn('[ESTADISTICAS] No se puede centrar el mapa: el mapa no está inicializado.');
    }
  }
}