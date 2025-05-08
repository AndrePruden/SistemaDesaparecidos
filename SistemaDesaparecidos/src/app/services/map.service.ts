import { Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private leafletLoaded = new BehaviorSubject<boolean>(false);
  leafletLoaded$ = this.leafletLoaded.asObservable();
  private L: any;

  async loadLeaflet(): Promise<void> {
    if (this.L) {
      return; // Leaflet ya está cargado
    }

    try {
      this.L = await import('leaflet');
      this.leafletLoaded.next(true);
      console.log('Leaflet cargado correctamente');
    } catch (error) {
      console.error('Error al cargar Leaflet:', error);
    }
  }

  getLeaflet(): any {
    return this.L;
  }

  isValidCoords(coords: [number, number] | null): boolean {
    return coords !== null &&
           coords[0] >= -90 &&
           coords[0] <= 90 &&
           coords[1] >= -180 &&
           coords[1] <= 180;
  }
}