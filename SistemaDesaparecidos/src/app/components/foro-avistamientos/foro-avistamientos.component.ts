import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';

interface Avistamiento {
  idAvistamiento: number;
  lugarDesaparicionLegible?: string;
  ubicacion: string;
  fecha: string;
  descripcion: string;
  personaDesaparecida: {
    nombre: string;
    lugarDesaparicion: string;
    fechaDesaparicion: string;
  };
}

@Component({
  selector: 'app-foro-avistamientos',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './foro-avistamientos.component.html',
  styleUrls: ['./foro-avistamientos.component.scss']
})
export class ForoAvistamientosComponent implements OnInit {
  avistamientos: Avistamiento[] = [];
  avistamientosFiltrados: Avistamiento[] = [];
  avistamientoSeleccionado: Avistamiento | null = null;

  nombreBusqueda = '';
  lugarBusqueda = '';
  fechaBusqueda = '';
  mapas: { [key: string]: any } = {};

  constructor(
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    private mapService: MapService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('[INIT] Componente cargado');
    this.obtenerAvistamientos();
  }

  obtenerAvistamientos(): void {
    this.avistamientoService.obtenerTodosLosAvistamientos().subscribe({
      next: (data: Avistamiento[]) => {
        this.avistamientos = [...data];
        this.avistamientosFiltrados = [...data];
        this.setDireccionesAvistamientos();
      },
      error: (err) => console.error('[ERROR] al obtener reportes:', err)
    });
  }

  setDireccionesAvistamientos(): void {
    this.avistamientosFiltrados.forEach(avistamiento => {
      const coords = this.mapService.parsearCoords(avistamiento.ubicacion);
      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => avistamiento.lugarDesaparicionLegible = direccion,
          error: () => avistamiento.lugarDesaparicionLegible = 'Ubicación desconocida'
        });
      } else {
        avistamiento.lugarDesaparicionLegible = avistamiento.ubicacion;
      }
    });
  }

  filtrarAvistamientos(): void {
    this.avistamientosFiltrados = this.avistamientos.filter( avistamiento => {
      return (!this.nombreBusqueda || avistamiento.personaDesaparecida.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase())) &&
             (!this.lugarBusqueda || avistamiento.ubicacion.toLowerCase().includes(this.lugarBusqueda.toLowerCase())) &&
             (!this.fechaBusqueda || avistamiento.fecha === this.fechaBusqueda);
    });
    this.setDireccionesAvistamientos();
    console.log('[FILTRO] Resultados filtrados:', this.avistamientosFiltrados);
  }

  limpiarFiltros(): void {
    this.nombreBusqueda = '';
    this.lugarBusqueda = '';
    this.fechaBusqueda = '';
    this.filtrarAvistamientos();
  }

  async mostrarPopup(avistamiento: Avistamiento): Promise<void> {
    try{
      this.avistamientoSeleccionado = { ...avistamiento };
      const coords = this.mapService.parsearCoords(avistamiento.personaDesaparecida.lugarDesaparicion);
      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => this.avistamientoSeleccionado!.lugarDesaparicionLegible = direccion,
          error: () => this.avistamientoSeleccionado!.lugarDesaparicionLegible = 'Dirección no disponible'
        });
      }
      await this.renderizarMapa(this.avistamientoSeleccionado, coords);
    } catch (error) {
      console.error('[ERROR] mostrando popup:', error);
    }
  }

  private async renderizarMapa(avistamiento: Avistamiento, coords: [number, number] | null): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    await this.mapService.loadLeaflet();
    const L = this.mapService.getLeaflet();
    if (!L) {
      console.error('Leaflet no disponible');
      return;
    }

    setTimeout(() => {
      const mapaId = 'mapaPopupA-' + avistamiento.idAvistamiento;
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
        this.mapService.addMarker(mapa, coords, 'red', 'Lugar donde fue visto', this.avistamientoSeleccionado?.lugarDesaparicionLegible || '');
      }
    }, 0);
  }

  cerrarPopup(): void {
    this.avistamientoSeleccionado = null;
  }
}
