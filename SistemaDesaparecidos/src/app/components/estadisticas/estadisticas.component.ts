import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

import { EstadisticasService, CoordenadaReporte } from '../../services/estadisticas.service';
import { MapService } from '../../services/map.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss'],
  imports: [HeaderComponent, FooterComponent]
})
export class EstadisticasComponent implements OnInit {
  mapa: L.Map | null = null;
  capasCirculos: L.CircleMarker[] = [];

  constructor(
    private estadisticasService: EstadisticasService,
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.inicializarMapa(), 500);
    }
  }

  inicializarMapa(): void {
    if (this.mapa) return;

    const contenedor = document.getElementById('mapa-estadisticas');
    if (!contenedor) {
      console.error('[ESTADISTICAS] Contenedor de mapa no encontrado');
      return;
    }

    contenedor.style.height = '500px';
    contenedor.style.width = '100%';

    const centro: [number, number] = [-17.3935, -66.1570];
    this.mapa = this.mapService.crearMapa('mapa-estadisticas', centro);

    this.estadisticasService.obtenerCoordenadas().subscribe(
      (coordenadas: CoordenadaReporte[]) => {
        coordenadas.forEach(coord => {
          const circle = L.circleMarker([coord.lat, coord.lng], {
            radius: 10,
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.3
          }).addTo(this.mapa!);
          this.capasCirculos.push(circle);
        });
      },
      error => {
        console.error('[ESTADISTICAS] Error al obtener coordenadas:', error);
      }
    );
  }
}
