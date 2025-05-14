import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { RouterModule } from '@angular/router';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';

interface Reporte {
  imagen: string;
  idDesaparecido: number;
  nombre: string;
  edad: number;
  lugarDesaparicion: string;
  fechaDesaparicion: string;
  lugarDesaparicionLegible?: string;
  ultimoAvistamiento?: Avistamiento | null;
  descripcion: string;
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
    private mapService: MapService,
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
      const coords = this.mapService.parsearCoords(reporte.lugarDesaparicion);
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
    console.log('[FILTRO] Resultados filtrados:', this.reportesFiltrados);
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
      const coords = this.mapService.parsearCoords(reporte.lugarDesaparicion);

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

    await this.mapService.loadLeaflet();
    const L = this.mapService.getLeaflet();
    if (!L) {
      console.error('Leaflet no disponible');
      return;
    }

    setTimeout(() => {
      const mapaId = 'mapaPopup-' + reporte.idDesaparecido;
      const divMapa = document.getElementById(mapaId);
      if (!divMapa) return;

      if (this.mapas[mapaId]) {
        this.mapas[mapaId].remove();
        delete this.mapas[mapaId];
      }

      const mapa = L.map(mapaId, { center: coords || [0, 0], zoom: 13 });
      this.mapas[mapaId] = mapa;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
      }).addTo(mapa);

      if (coords) {
        this.mapService.addMarker(mapa, coords, 'red', 'Lugar de desaparición', this.reporteSeleccionado?.lugarDesaparicionLegible || '');
      }

      const avistamiento = reporte.ultimoAvistamiento;
      if (avistamiento?.ubicacion) {
        const coordsAvistamiento = this.mapService.parsearCoords(avistamiento.ubicacion);
        if (coordsAvistamiento) {
          this.mapService.addMarker(mapa, coordsAvistamiento, 'blue', 'Último avistamiento', `${new Date(avistamiento.fecha).toLocaleDateString()}<br>${avistamiento.descripcion}`)
          if (coords) {
            mapa.fitBounds(L.latLngBounds([coords, coordsAvistamiento]), { padding: [50, 50] });
          } else {
            mapa.setView(coordsAvistamiento, 15);
          }
        }
      } else if (coords) {
        mapa.setView(coords, 15);
      }
    },0);
  }
  
  cerrarPopup(): void {
    this.reporteSeleccionado = null;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/470100848/es/vector/macho-icono-de-perfil-blanco-en-fondo-azul.jpg?s=612x612&w=0&k=20&c=HVwuxvS7hDgG6qOZXRXvsHbLVRKP5zrIllm09LWMgjc=';
  }
}