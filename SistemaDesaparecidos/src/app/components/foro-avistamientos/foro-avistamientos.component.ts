import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AvistamientoService } from '../../services/avistamiento.service';

@Component({
  selector: 'app-foro-avistamientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './foro-avistamientos.component.html',
  styleUrls: ['./foro-avistamientos.component.scss']
})
export class ForoAvistamientosComponent implements OnInit, OnDestroy {
  avistamientos: any[] = [];
  mensaje: string = '';
  avistamientoSeleccionado: any = null;
  mapa: any = null;
  coordenadasValidas: boolean = false;

  constructor(
    private avistamientoService: AvistamientoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarAvistamientos();
  }

  ngOnDestroy(): void {
    this.limpiarMapa();
  }

  cargarAvistamientos(): void {
    this.avistamientoService.obtenerTodosLosAvistamientos().subscribe({
      next: (data) => {
        console.log('Avistamientos recibidos:', data);
        this.avistamientos = data.map(avistamiento => {
          // Asegurarnos de que la ubicación esté en el formato correcto
          return {
            ...avistamiento,
            ubicacion: avistamiento.ubicacion || avistamiento.lugar || 'Coordenadas no disponibles'
          };
        });
        
        if (data.length === 0) {
          this.mensaje = 'No hay avistamientos reportados aún.';
        }
      },
      error: (error) => {
        console.error('Error al cargar avistamientos:', error);
        this.mensaje = 'Error al cargar los avistamientos. Por favor, intente nuevamente.';
      }
    });
  }

  async mostrarMapa(avistamiento: any) {
    this.avistamientoSeleccionado = avistamiento;
    this.coordenadasValidas = false;
    
    // Esperar a que el DOM se actualice
    setTimeout(async () => {
      if (isPlatformBrowser(this.platformId)) {
        const L = await import('leaflet');
        const divMapa = document.getElementById('mapaAvistamiento');
  
        if (divMapa) {
          this.limpiarMapa();
          divMapa.innerHTML = ''; // Limpiar cualquier contenido previo
          
          // Normalizar el campo de ubicación (puede venir como 'ubicacion' o 'lugar')
          const ubicacion = avistamiento.ubicacion || avistamiento.lugar || '';
          const coords = this.parsearCoordenadas(ubicacion);
          
          if (coords) {
            this.coordenadasValidas = true;
            this.inicializarMapa(L, divMapa, coords, avistamiento);
          } else {
            this.mostrarMensajeSinCoordenadas(divMapa);
          }
        }
      }
    }, 0);
  }

  inicializarMapa(L: any, divMapa: HTMLElement, coords: [number, number], avistamiento: any) {
    this.mapa = L.map(divMapa).setView(coords, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapa);

    const customIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    L.marker(coords, { icon: customIcon }).addTo(this.mapa)
      .bindPopup(`<b>${avistamiento.personaDesaparecida?.nombre || 'Desconocido'}</b><br>
                  <b>Fecha:</b> ${new Date(avistamiento.fecha).toLocaleDateString()}<br>
                  <b>Lugar:</b> ${avistamiento.ubicacion || avistamiento.lugar || 'Coordenadas no disponibles'}<br>
                  <b>Descripción:</b> ${avistamiento.descripcion || 'No hay descripción disponible'}`);
  }

  mostrarMensajeSinCoordenadas(divMapa: HTMLElement) {
    divMapa.innerHTML = `
      <div class="no-coords-message">
        <i class="icono-advertencia">⚠️</i>
        <p>No hay coordenadas disponibles para mostrar el mapa</p>
      </div>
    `;
    divMapa.classList.add('no-coords');
  }

  parsearCoordenadas(coordenadasStr: string): [number, number] | null {
    if (!coordenadasStr || coordenadasStr.trim() === '') {
      return null;
    }

    // Eliminar paréntesis si existen
    const strLimpio = coordenadasStr.replace(/[()]/g, '');
    
    // Dividir por coma o espacio
    const parts = strLimpio.split(/[, ]+/).map(part => parseFloat(part.trim()));
    
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      // Validar rangos aproximados de latitud y longitud
      if (parts[0] >= -90 && parts[0] <= 90 && parts[1] >= -180 && parts[1] <= 180) {
        return [parts[0], parts[1]];
      }
    }
    
    return null;
  }

  limpiarMapa(): void {
    if (this.mapa) {
      this.mapa.off();
      this.mapa.remove();
      this.mapa = null;
    }
  }

  cerrarMapa(): void {
    this.avistamientoSeleccionado = null;
    this.coordenadasValidas = false;
    this.limpiarMapa();
  }
}