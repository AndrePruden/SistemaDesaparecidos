import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly L: typeof L = L;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.fixLeafletIcons();
  }

  private fixLeafletIcons(): void {
    const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
    const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

    delete (this.L.Icon.Default.prototype as any)._getIconUrl;
    this.L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  parsearCoords(coordsStr: string): [number, number] | null {
    if (!coordsStr) return null;
    const parts = coordsStr.split(',').map(p => parseFloat(p.trim()));
    return parts.length === 2 && !parts.some(isNaN) ? [parts[0], parts[1]] : null;
  }

  crearMapa(containerId: string, center: [number, number], zoom = 13): L.Map | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    
    try {
      const divMapa = document.getElementById(containerId);
      if (!divMapa) {
        console.error(`Contenedor ${containerId} no encontrado`);
        return null;
      }

      // Asegura dimensiones mínimas
      divMapa.style.height = '400px';
      divMapa.style.width = '100%';

      const mapa = this.L.map(containerId, {
        center,
        zoom,
        preferCanvas: true // Mejor rendimiento
      });

      this.agregarCapaTiles(mapa);
      return mapa;

    } catch (error) {
      console.error('Error al crear mapa:', error);
      return null;
    }
  }

  agregarCapaTiles(mapa: L.Map): void {
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      detectRetina: true
    }).addTo(mapa);
  }

  agregarMarcador(
    mapa: L.Map,
    coords: [number, number],
    color: 'red' | 'blue',
    titulo: string,
    contenido: string
  ): void {
    try {
      const iconUrl = color === 'red'
        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png';

      const icon = this.L.icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });

      this.L.marker(coords, { icon })
        .addTo(mapa)
        .bindPopup(`<b>${titulo}</b><br>${contenido}`);

    } catch (error) {
      console.error('Error al agregar marcador (usando default):', error);
      // Fallback a marcador por defecto
      this.L.marker(coords)
        .addTo(mapa)
        .bindPopup(`<b>${titulo}</b><br>${contenido}`);
    }
  }

  ajustarVista(
    mapa: L.Map,
    coords1: [number, number],
    coords2?: [number, number]
  ): void {
    if (!mapa) return;

    try {
      if (coords2) {
        mapa.fitBounds(this.L.latLngBounds([coords1, coords2]), { 
          padding: [50, 50],
          maxZoom: 15
        });
      } else {
        mapa.setView(coords1, 15);
      }
    } catch (error) {
      console.error('Error al ajustar vista:', error);
    }
  }

  eliminarMapa(mapa: L.Map): void {
    if (mapa && typeof mapa.remove === 'function') {
      mapa.remove();
    }
  }

  get leaflet(): typeof L {
    return this.L;
  }
}