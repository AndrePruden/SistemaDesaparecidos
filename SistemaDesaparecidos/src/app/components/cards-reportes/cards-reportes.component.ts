import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { AvistamientoService } from '../../services/avistamiento.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cards-reportes',
  templateUrl: './cards-reportes.component.html',
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./cards-reportes.component.scss']
})
export class CardsReportesComponent implements OnInit {
  reportes: any[] = [];
  reportesFiltrados: any[] = [];
  nombreBusqueda: string = '';
  edadBusqueda: number | null = null;
  lugarBusqueda: string = '';
  fechaBusqueda: string = '';
  mapas: any = {};
  reporteSeleccionado: any = null;

  constructor(
    private reportesService: ReportesService,
    private avistamientoService: AvistamientoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('[INIT] Iniciando componente de reportes...');
    this.obtenerReportes();
  }

  obtenerReportes(): void {
    console.log('[HTTP] Solicitando reportes...');
    this.reportesService.obtenerReportes().subscribe(
      (data) => {
        console.log('[HTTP] Reportes recibidos:', data);
        this.reportes = data;
        this.reportesFiltrados = data;
        this.cargarUltimosAvistamientos();
      },
      (error) => {
        console.error('[ERROR] Error al obtener reportes:', error);
      }
    );
  }

  cargarUltimosAvistamientos(): void {
    this.reportesFiltrados.forEach(reporte => {
      this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).subscribe(
        avistamiento => {
          reporte.ultimoAvistamiento = avistamiento;
        },
        error => {
          console.error(`[ERROR] Error al obtener el último avistamiento para el reporte ${reporte.idDesaparecido}:`, error);
          reporte.ultimoAvistamiento = null; // Manejar el caso de error
        }
      );
    });
  }

  filtrarReportes() {
    console.log('[FILTRO] Aplicando filtros: ', {
      nombre: this.nombreBusqueda,
      edad: this.edadBusqueda,
      lugar: this.lugarBusqueda,
      fecha: this.fechaBusqueda
    });
    this.reportesFiltrados = this.reportes.filter(reporte => {
      const nombreCoincide = !this.nombreBusqueda || reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());
      const edadCoincide = !this.edadBusqueda || reporte.edad === this.edadBusqueda;
      const lugarCoincide = !this.lugarBusqueda || reporte.lugarDesaparicion.toLowerCase().includes(this.lugarBusqueda.toLowerCase());
      const fechaCoincide = !this.fechaBusqueda || reporte.fechaDesaparicion === this.fechaBusqueda;

      return nombreCoincide && edadCoincide && lugarCoincide && fechaCoincide;
    });
    console.log('[FILTRO] Resultados filtrados:', this.reportesFiltrados);

    this.cargarUltimosAvistamientos();
  }

  limpiarFiltros() {
    console.log('[FILTRO] Limpiando filtros...');
    this.nombreBusqueda = '';
    this.edadBusqueda = null;
    this.lugarBusqueda = '';
    this.fechaBusqueda = '';
    this.filtrarReportes();
  }

 async mostrarPopup(reporte: any) {
    console.log('[POPUP] Solicitando último avistamiento para el reporte:', reporte.idDesaparecido);
  
    try {
      // Obtener el último avistamiento (si no se ha cargado ya)
      if (!reporte.ultimoAvistamiento) {
        reporte.ultimoAvistamiento = await this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).toPromise();
      }
  
      this.reporteSeleccionado = { ...reporte };
      const desaparicionCoords = this.parsearCoordenadas(reporte.lugarDesaparicion);
  
      setTimeout(async () => {
        if (isPlatformBrowser(this.platformId)) {
          const L = await import('leaflet');
          const mapaId = 'mapaPopup-' + this.reporteSeleccionado.idDesaparecido;
          const divMapa = document.getElementById(mapaId);
  
          if (divMapa) {
            if (this.mapas[mapaId]) {
              this.mapas[mapaId].remove();
            }
  
            const mapa = L.map(mapaId, {
              center: desaparicionCoords || [0, 0],
              zoom: 13
            });
            this.mapas[mapaId] = mapa;
  
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(mapa);
  
            // Marcador de lugar de desaparición
            if (desaparicionCoords) {
              L.marker(desaparicionCoords, {
                icon: L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34]
                })
              }).addTo(mapa)
                .bindPopup(`<b>Lugar de desaparición</b><br>${reporte.lugarDesaparicion}`);
            }
  
            // Marcador de último avistamiento
            if (reporte.ultimoAvistamiento?.ubicacion) {
              const avistamientoCoords = this.parsearCoordenadas(reporte.ultimoAvistamiento.ubicacion);
              if (avistamientoCoords) {
                L.marker(avistamientoCoords, {
                  icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                  })
                }).addTo(mapa)
                  .bindPopup(`<b>Último avistamiento</b><br>${new Date(reporte.ultimoAvistamiento.fecha).toLocaleDateString()}<br>${reporte.ultimoAvistamiento.descripcion}`);
  
                if (desaparicionCoords) {
                  const bounds = L.latLngBounds([desaparicionCoords, avistamientoCoords]);
                  mapa.fitBounds(bounds, { padding: [50, 50] });
                } else {
                  mapa.setView(avistamientoCoords, 15);
                }
              }
            } else if (desaparicionCoords) {
              mapa.setView(desaparicionCoords, 15);
            }
          }
        }
      }, 100);
    } catch (error) {
      console.error('[ERROR] Error al mostrar el popup:', error);
    }
  }
  
  

  parsearCoordenadas(coordenadasStr: string): [number, number] | null {
    if (!coordenadasStr) return null;

    const parts = coordenadasStr.split(',').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return null;
  }

  cerrarPopup() {
    this.reporteSeleccionado = null;
  }
}