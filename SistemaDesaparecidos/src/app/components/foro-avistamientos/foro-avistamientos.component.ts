import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
import { Subscription } from 'rxjs';
// Importar la interfaz Avistamiento desde el servicio en lugar de definirla aquí
import { Avistamiento } from '../../services/avistamiento.service'; // <-- Importado

// ELIMINAR ESTA DEFINICIÓN LOCAL DUPLICADA DE Avistamiento
/*
interface Avistamiento {
  idAvistamiento: number;
  emailUsuario: string;
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
*/

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

  nombreBusqueda = '';
  lugarBusqueda = '';
  fechaBusquedaInicio = '';
  fechaBusquedaFin = '';
  mapas: { [key: string]: any } = {};

  currentUserEmail: string | null = null;
  private avistamientoChangeSubscription: Subscription | undefined;

  constructor(
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    private mapService: MapService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('[INIT] Componente foro-avistamientos cargado');
    this.getCurrentUserEmail();
    this.obtenerAvistamientos();

    this.avistamientoChangeSubscription = this.avistamientoService.avistamientoCambiado$.subscribe(() => {
      console.log('🟠 Cambio en avistamientos detectado. Recargando lista...');
      this.obtenerAvistamientos();
    });
  }

  ngOnDestroy(): void {
    if (this.avistamientoChangeSubscription) {
      this.avistamientoChangeSubscription.unsubscribe();
    }
    this.limpiarTodosLosMapas();
  }

  private getCurrentUserEmail(): void {
    if (isPlatformBrowser(this.platformId)) {
        this.currentUserEmail = localStorage.getItem('email');
        console.log('👤 Email del usuario actual:', this.currentUserEmail);
    }
  }

  obtenerAvistamientos(): void {
    // Ahora suscribimos al observable que devuelve Avistamiento[]
    // Y TypeScript usa la interfaz Avistamiento que acabamos de importar
    this.avistamientoService.obtenerTodosLosAvistamientos().subscribe(
      (data: Avistamiento[]) => { // <--- Aquí ya no debería marcar error
        this.avistamientos = [...data];
        this.avistamientosFiltrados = [...data];
        console.log('[DATA] Avistamientos cargados:', this.avistamientos);
        this.setDireccionesAvistamientos();
      },
      (err) => console.error('[ERROR] al obtener avistamientos:', err)
    );
  }

  setDireccionesAvistamientos(): void {
    this.avistamientosFiltrados.forEach(avistamiento => {
      if (avistamiento.lugarDesaparicionLegible) {
          return;
      }
      const coords = this.mapService.parsearCoords(avistamiento.ubicacion);
      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe(
          direccion => {
             const originalAvistamiento = this.avistamientos.find(a => a.idAvistamiento === avistamiento.idAvistamiento);
             if(originalAvistamiento) {
                 originalAvistamiento.lugarDesaparicionLegible = direccion;
             }
             avistamiento.lugarDesaparicionLegible = direccion;
          },
          () => avistamiento.lugarDesaparicionLegible = 'Ubicación desconocida'
        );
      } else {
        avistamiento.lugarDesaparicionLegible = avistamiento.ubicacion;
      }
    });
  }

  filtrarAvistamientos(): void {
    this.avistamientosFiltrados = this.avistamientos.filter(avistamiento => {
      const nombreMatch = !this.nombreBusqueda || avistamiento.personaDesaparecida.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());
      const lugarAvistamientoTexto = avistamiento.lugarDesaparicionLegible || avistamiento.ubicacion;
      const lugarMatch = !this.lugarBusqueda || lugarAvistamientoTexto.toLowerCase().includes(this.lugarBusqueda.toLowerCase());

      const fechaAvistamiento = new Date(avistamiento.fecha);
      const fechaInicio = this.fechaBusquedaInicio ? new Date(this.fechaBusquedaInicio) : null;
      const fechaFin = this.fechaBusquedaFin ? new Date(this.fechaBusquedaFin) : null;

      const fechaMatch =
        (!fechaInicio || fechaAvistamiento >= fechaInicio) &&
        (!fechaFin || fechaAvistamiento <= fechaFin);
      return nombreMatch && lugarMatch && fechaMatch;
    });
    console.log('[FILTRO] Resultados filtrados:', this.avistamientosFiltrados.length);
  }

  limpiarFiltros(): void {
    this.nombreBusqueda = '';
    this.lugarBusqueda = '';
    this.fechaBusquedaInicio = '';
    this.fechaBusquedaFin = '';
    this.filtrarAvistamientos();
  }

  async mostrarPopup(avistamiento: Avistamiento): Promise<void> {
    try{
      this.avistamientoSeleccionado = { ...avistamiento };

      const coordsAvistamiento = this.mapService.parsearCoords(avistamiento.ubicacion);
       if (coordsAvistamiento) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coordsAvistamiento[0], coordsAvistamiento[1]).subscribe(
          direccion => this.avistamientoSeleccionado!.lugarDesaparicionLegible = direccion,
          () => this.avistamientoSeleccionado!.lugarDesaparicionLegible = 'Ubicación no disponible'
        );
      } else {
         this.avistamientoSeleccionado!.lugarDesaparicionLegible = avistamiento.ubicacion;
      }

      await this.renderizarMapaPopup(this.avistamientoSeleccionado, coordsAvistamiento);

    } catch (error) {
      console.error('[ERROR] mostrando popup:', error);
    }
  }

  private async renderizarMapaPopup(avistamiento: Avistamiento, coords: [number, number] | null): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !coords) {
        console.warn('No se puede renderizar mapa: No es navegador o no hay coordenadas.');
        return;
    }

    await this.mapService.loadLeaflet();
    const L = this.mapService.getLeaflet();
    if (!L) {
      console.error('Leaflet no disponible');
      return;
    }

    setTimeout(() => {
      const mapaId = 'mapaPopupA-' + avistamiento.idAvistamiento;
      const divMapa = document.getElementById(mapaId);
      if (!divMapa) {
          console.error(`Div del mapa no encontrado: ${mapaId}`);
          return;
      }

      if (this.mapas[mapaId]) {
        this.mapas[mapaId].remove();
        delete this.mapas[mapaId];
        console.log(`Limpiado mapa existente para ${mapaId}`);
      }

      try {
         const mapa = L.map(divMapa).setView(coords, 13);
         this.mapas[mapaId] = mapa;

         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
           attribution: '© OpenStreetMap contributors'
         }).addTo(mapa);

         this.mapService.addMarker(mapa, coords, 'blue', 'Lugar del Avistamiento', avistamiento.lugarDesaparicionLegible || avistamiento.ubicacion);

         mapa.invalidateSize();
         console.log(`Mapa renderizado para ${mapaId} en coords ${coords}`);

      } catch (error) {
          console.error(`Error al inicializar el mapa para ${mapaId}:`, error);
      }
    }, 100);
  }

  cerrarPopup(): void {
    if (this.avistamientoSeleccionado) {
      const mapaId = 'mapaPopupA-' + this.avistamientoSeleccionado.idAvistamiento;
      if (this.mapas[mapaId]) {
         this.mapas[mapaId].remove();
         delete this.mapas[mapaId];
         console.log(`Mapa ${mapaId} limpiado al cerrar popup.`);
      }
    }
    this.avistamientoSeleccionado = null;
  }

  irAEditarAvistamiento(idAvistamiento: number): void {
      console.log(`Navegando a editar avistamiento con ID: ${idAvistamiento}`);
      this.router.navigate(['/avistamientos/form', idAvistamiento]);
  }

  private limpiarTodosLosMapas(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    for (const mapaId in this.mapas) {
      if (this.mapas[mapaId]) {
        this.mapas[mapaId].remove();
      }
    }
    this.mapas = {};
    console.log('Todos los mapas limpiados.');
  }
}