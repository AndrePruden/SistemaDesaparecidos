import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { AvistamientoService } from '../../services/avistamiento.service';
import { RouterModule } from '@angular/router';
import { GeocodificacionService } from '../../services/geocodificacion.service';

interface Reporte {
  idDesaparecido: number;
  nombre: string;
  edad: number;
  lugarDesaparicion: string;
  fechaDesaparicion: string;
  lugarDesaparicionLegible?: string;
  ultimoAvistamiento?: Avistamiento | null;
}

interface Avistamiento {
  ubicacion: string;
  fecha: string;
  descripcion: string;
}
@Component({
  selector: 'app-cards-reportes',
  templateUrl: './cards-reportes.component.html',
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./cards-reportes.component.scss']
})
export class CardsReportesComponent implements OnInit {
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  nombreBusqueda = '';
  edadBusqueda: number | null = null;
  lugarBusqueda = '';
  fechaBusqueda = '';
  mapas: { [key: string]: any } = {};
  reporteSeleccionado: Reporte | null = null;

  constructor(
    private reportesService: ReportesService,
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('[INIT] Componente cargado');
    this.obtenerReportes();
  }

  obtenerReportes(): void {
    this.reportesService.obtenerReportes().subscribe({
      next: (data: Reporte[]) => {
        this.reportes = [...data];
        this.reportesFiltrados = [...data];
        this.setDireccionesReportes();
        this.cargarUltimosAvistamientos();
      },
      error: (err) => console.error('[ERROR] al obtener reportes:', err)
    });
  }

  setDireccionesReportes(): void {
    this.reportesFiltrados.forEach(reporte => {
      const coords = this.parsearCoordenadas(reporte.lugarDesaparicion);
      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => reporte.lugarDesaparicionLegible = direccion,
          error: () => reporte.lugarDesaparicionLegible = 'Ubicación desconocida'
        });
      } else {
        reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion;
      }
    });
  }

  cargarUltimosAvistamientos(): void {
    this.reportesFiltrados.forEach(reporte => {
      this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).subscribe({
        next: avistamiento => reporte.ultimoAvistamiento = avistamiento,
        error: () => reporte.ultimoAvistamiento = null
      });
    });
  }

  filtrarReportes(): void {
    this.reportesFiltrados = this.reportes.filter(reporte => {
      return (!this.nombreBusqueda || reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase())) &&
             (!this.edadBusqueda || reporte.edad === this.edadBusqueda) &&
             (!this.lugarBusqueda || reporte.lugarDesaparicion.toLowerCase().includes(this.lugarBusqueda.toLowerCase())) &&
             (!this.fechaBusqueda || reporte.fechaDesaparicion === this.fechaBusqueda);
    });
    this.setDireccionesReportes();
    this.cargarUltimosAvistamientos();
  }

  limpiarFiltros(): void {
    this.nombreBusqueda = '';
    this.edadBusqueda = null;
    this.lugarBusqueda = '';
    this.fechaBusqueda = '';
    this.filtrarReportes();
  }

  async mostrarPopup(reporte: Reporte): Promise<void> {
    try {
      if (!reporte.ultimoAvistamiento) {
        reporte.ultimoAvistamiento = await this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).toPromise();
      }

      this.reporteSeleccionado = { ...reporte };
      const coords = this.parsearCoordenadas(reporte.lugarDesaparicion);

      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => this.reporteSeleccionado!.lugarDesaparicionLegible = direccion,
          error: () => this.reporteSeleccionado!.lugarDesaparicionLegible = 'Ubicación desconocida'
        });
      }

      await this.renderizarMapa(this.reporteSeleccionado, coords);
    } catch (error) {
      console.error('[ERROR] mostrando popup:', error);
    }
  }

  private async renderizarMapa(reporte: Reporte, coords: [number, number] | null): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const L = await import('leaflet');
    const mapaId = 'mapaPopup-' + reporte.idDesaparecido;
    const divMapa = document.getElementById(mapaId);
    if (!divMapa) return;

    if (this.mapas[mapaId]) this.mapas[mapaId].remove();

    const mapa = L.map(mapaId, { center: coords || [0, 0], zoom: 13 });
    this.mapas[mapaId] = mapa;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);

    if (coords) {
      this.agregarMarcador(mapa, coords, 'red', 'Lugar de desaparición', this.reporteSeleccionado?.lugarDesaparicionLegible || '');
    }

    const avistamiento = reporte.ultimoAvistamiento;
    if (avistamiento?.ubicacion) {
      const coordsAvistamiento = this.parsearCoordenadas(avistamiento.ubicacion);
      if (coordsAvistamiento) {
        this.agregarMarcador(mapa, coordsAvistamiento, 'blue', 'Último avistamiento', `${new Date(avistamiento.fecha).toLocaleDateString()}<br>${avistamiento.descripcion}`);
        if (coords) {
          mapa.fitBounds(L.latLngBounds([coords, coordsAvistamiento]), { padding: [50, 50] });
        } else {
          mapa.setView(coordsAvistamiento, 15);
        }
      }
    } else if (coords) {
      mapa.setView(coords, 15);
    }
  }

  private agregarMarcador(mapa: any, coords: [number, number], color: 'red' | 'blue', titulo: string, texto: string) {
    const L = window['L'];
    const iconUrl = color === 'red'
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png';

    L.marker(coords, {
      icon: L.icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      })
    }).addTo(mapa).bindPopup(`<b>${titulo}</b><br>${texto}`);
  }

  parsearCoordenadas(coordenadasStr: string): [number, number] | null {
    const parts = coordenadasStr?.split(',').map(p => parseFloat(p.trim()));
    return parts?.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? [parts[0], parts[1]] : null;
  }

  cerrarPopup(): void {
    this.reporteSeleccionado = null;
  }
}
