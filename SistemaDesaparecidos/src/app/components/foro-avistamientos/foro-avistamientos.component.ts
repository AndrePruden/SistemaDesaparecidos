import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';

interface Avistamiento {
  idAvistamiento: number;
  lugarDesaparicionLegible: string;
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
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './foro-avistamientos.component.html',
  styleUrls: ['./foro-avistamientos.component.scss']
})
export class ForoAvistamientosComponent implements OnInit {
  avistamientos: Avistamiento[] = [];
  avistamientosFiltrados: Avistamiento[] = [];
  avistamientoSeleccionado: Avistamiento | null = null;
  mapas: { [key: string]: L.Map } = {}; // Tipo corregido a L.Map

  // Filtros
  nombreBusqueda = '';
  lugarBusqueda = '';
  fechaBusquedaInicio = '';
  fechaBusquedaFin = '';

  constructor(
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    private mapService: MapService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.obtenerAvistamientos();
    }
  }

  obtenerAvistamientos(): void {
    this.avistamientoService.obtenerTodosLosAvistamientos().subscribe({
      next: (data: Avistamiento[]) => {
        this.avistamientos = [...data];
        this.avistamientosFiltrados = [...data];
        this.setDireccionesAvistamientos();
      },
      error: (err) => console.error('Error al obtener avistamientos:', err)
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
    this.avistamientosFiltrados = this.avistamientos.filter(avistamiento => {
      const nombreMatch = !this.nombreBusqueda || 
        avistamiento.personaDesaparecida.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());
      
      const lugarMatch = !this.lugarBusqueda || 
        avistamiento.lugarDesaparicionLegible.toLowerCase().includes(this.lugarBusqueda.toLowerCase());

      const fechaAvistamiento = new Date(avistamiento.fecha);
      const fechaInicio = this.fechaBusquedaInicio ? new Date(this.fechaBusquedaInicio) : null;
      const fechaFin = this.fechaBusquedaFin ? new Date(this.fechaBusquedaFin) : null;

      const fechaMatch =
        (!fechaInicio || fechaAvistamiento >= fechaInicio) &&
        (!fechaFin || fechaAvistamiento <= fechaFin);
      
      return nombreMatch && lugarMatch && fechaMatch;
    });
  }

  limpiarFiltros(): void {
    this.nombreBusqueda = '';
    this.lugarBusqueda = '';
    this.fechaBusquedaInicio = '';
    this.fechaBusquedaFin = '';
    this.filtrarAvistamientos();
  }

  async mostrarPopup(avistamiento: Avistamiento): Promise<void> {
    try {
      this.avistamientoSeleccionado = { ...avistamiento };
      const coords = this.mapService.parsearCoords(avistamiento.ubicacion);
      
      if (coords) {
        await this.renderizarMapa(avistamiento, coords);
      }
    } catch (error) {
      console.error('Error al mostrar popup:', error);
    }
  }

  private async renderizarMapa(avistamiento: Avistamiento, coords: [number, number]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const mapaId = 'mapaPopupA-' + avistamiento.idAvistamiento;
    
    // Espera a que Angular renderice el popup
    await new Promise(resolve => setTimeout(resolve, 50));

    const divMapa = document.getElementById(mapaId);
    if (!divMapa) {
      console.error('❌ Div del mapa no encontrado:', mapaId);
      console.log('Contenido del popup:', document.querySelector('.popup')?.innerHTML);
      return;
    }

    // Asegura dimensiones
    divMapa.style.height = '400px';
    divMapa.style.width = '100%';
    divMapa.style.backgroundColor = '#f0f0f0'; // Temporal para debug

    // Limpia mapa existente
    if (this.mapas[mapaId]) {
      this.mapService.eliminarMapa(this.mapas[mapaId]);
      delete this.mapas[mapaId];
    }

    try {
      // Crea el mapa
      const mapa = this.mapService.crearMapa(mapaId, coords);
      if (!mapa) throw new Error('El servicio devolvió un mapa nulo');

      this.mapas[mapaId] = mapa;

      // Añade marcador principal
      this.mapService.agregarMarcador(
        mapa,
        coords,
        'red',
        'Lugar de avistamiento',
        this.avistamientoSeleccionado?.lugarDesaparicionLegible || ''
      );

      // Redibujado final
      setTimeout(() => {
        mapa.invalidateSize();
        console.log('✅ Mapa creado correctamente para avistamiento ID:', avistamiento.idAvistamiento);
        divMapa.style.border = '2px solid green'; // Confirmación visual
      }, 100);

    } catch (error) {
      console.error('Error al renderizar mapa:', error);
      divMapa.innerHTML = `
        <div style="color:red; padding:10px;">
          <h4>Error al cargar el mapa</h4>
          <p>${error instanceof Error ? error.message : 'Error desconocido'}</p>
        </div>
      `;
    }
  }

  cerrarPopup(): void {
    this.avistamientoSeleccionado = null;
  }
}