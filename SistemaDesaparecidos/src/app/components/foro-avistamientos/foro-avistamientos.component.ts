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
  coordenadasValidas: boolean = false;
  private leaflet: any;
  private mapa: any;
  private iconoAvistamientoForo: any;

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
    
    // Esperar a que Angular actualice la vista
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Cargar Leaflet solo si no está cargado
        if (!this.leaflet) {
          this.leaflet = await import('leaflet');
          // Configurar iconos por defecto
          this.leaflet.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
          });
        }
        
        await this.inicializarMapa(this.leaflet, avistamiento);
      } catch (error) {
        console.error('Error al cargar Leaflet:', error);
        this.mostrarMensajeError();
      }
    }
  }
  
  private async inicializarMapa(L: any, avistamiento: any) {
    const divMapa = document.getElementById('mapaAvistamiento');
    
    if (!divMapa) {
      console.error('Elemento del mapa no encontrado');
      return;
    }
    
    // Limpiar cualquier contenido previo
    this.limpiarMapa();
    divMapa.innerHTML = '';
    divMapa.style.height = '400px';
    divMapa.style.width = '100%';
    
    // Limpiar mapa existente
    if ((divMapa as any)._leaflet_map) {
      (divMapa as any)._leaflet_map.remove();
    }
        
    // Normalizar coordenadas
    const ubicacion = avistamiento.ubicacion || avistamiento.lugar || '';
    const coords = this.parsearCoordenadas(ubicacion);
    
    if (coords) {
      this.coordenadasValidas = true;
      
      try {

        this.iconoAvistamientoForo = L.icon({ // Usa L (el argumento) para crear el icono
          iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png', // URL del ícono del marcador
          iconSize: [25, 41], // Tamaño del ícono
          iconAnchor: [12, 41], // Donde el punto de anclaje del ícono estará (al pie del marcador)
          popupAnchor: [1, -34], // Lugar donde el popup debería abrirse
          shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png', // Sombra del marcador
          shadowSize: [41, 41] // Tamaño de la sombra
      });

        // Crear nuevo mapa
        this.mapa = L.map(divMapa).setView(coords, 15);
        
        // Capa base
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.mapa);
        
        // Marcador
        L.marker(coords, { icon: this.iconoAvistamientoForo })
          .addTo(this.mapa)
          .bindPopup(`
            <b>${avistamiento.personaDesaparecida?.nombre || 'Desconocido'}</b><br>
            <b>Fecha:</b> ${new Date(avistamiento.fecha).toLocaleDateString()}<br>
            <b>Coordenadas:</b> ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}
          `)
          .openPopup();
        
        // Forzar redimensionamiento
        setTimeout(() => {
          this.mapa.invalidateSize();
        }, 100);
      } catch (error) {
        console.error('Error al inicializar mapa:', error);
        this.mostrarMensajeError(divMapa);
      }
    } else {
      this.mostrarMensajeSinCoordenadas(divMapa);
    }
  }

  private mostrarMensajeError(divMapa?: HTMLElement) {
    const container = divMapa || document.getElementById('mapaAvistamiento');
    if (container) {
      container.innerHTML = `
        <div class="map-error-message">
          <i class="error-icon">❌</i>
          <p>Error al cargar el mapa</p>
        </div>
      `;
    }
  }

  private mostrarMensajeSinCoordenadas(divMapa: HTMLElement) {
    divMapa.innerHTML = `
      <div class="no-coords-message">
        <i class="icono-advertencia">⚠️</i>
        <p>No hay coordenadas disponibles para mostrar el mapa</p>
      </div>
    `;
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
    if (!isPlatformBrowser(this.platformId)) return;
  
    if (this.mapa) {
      this.mapa.off();
      this.mapa.remove();
      this.mapa = null;
    }
    
    // Limpiar también el contenedor del DOM
    const divMapa = document.getElementById('mapaAvistamiento');
    if (divMapa) {
      divMapa.innerHTML = '';
    }
  }

  cerrarMapa(): void {
    this.avistamientoSeleccionado = null;
    this.coordenadasValidas = false;
    this.limpiarMapa();
  }
}