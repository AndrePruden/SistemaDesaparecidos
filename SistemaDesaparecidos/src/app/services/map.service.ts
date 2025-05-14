import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

import * as Leaflet from 'leaflet';

@Injectable({
  providedIn: 'root'
})

export class MapService {
  private leafletLoaded = new BehaviorSubject<boolean>(false);
  leafletLoaded$ = this.leafletLoaded.asObservable();
  private L: typeof Leaflet | null = null;

  async loadLeaflet(): Promise<void> {
    if (this.L) return;

    try {
      this.L = await import('leaflet');
      this.leafletLoaded.next(true);
      console.log('Leaflet cargado correctamente');
    } catch (error) {
      console.error('Error al cargar Leaflet:', error);
    }
  }

  parsearCoords(coordsStr: string): [number, number] | null {
    const parts = coordsStr?.split(',').map(p => parseFloat(p.trim()));
    return parts?.length === 2 && parts.every(n => !isNaN(n)) ? [parts[0], parts[1]] : null;
  }

  // isValidCoords(coords: [number, number] | null): boolean {
  //   return coords !== null &&
  //     coords[0] >= -90 && coords[0] <= 90 &&
  //     coords[1] >= -180 && coords[1] <= 180;
  // }

  renderMap(containerId: string, center: [number, number], zoom = 13): any {
    if (!this.L) return null;
    const map = this.L.map(containerId, { center, zoom });
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    return map;
  }

  addMarker(map: any, coords: [number, number], color: 'red' | 'blue', title: string, text: string): void {
    if (!this.L) return;

    const iconUrl = color === 'red'
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png';

    this.L.marker(coords, {
      icon: this.L.icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      })
    }).addTo(map).bindPopup(`<b>${title}</b><br>${text}`);
  }

  getLeaflet(): any {
    return this.L;
  }
}