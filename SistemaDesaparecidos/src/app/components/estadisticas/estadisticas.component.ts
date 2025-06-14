import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.heat';

import { EstadisticasService, CoordenadaReporte } from '../../services/estadisticas.service';
import { MapService } from '../../services/map.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

// Nueva interfaz para zonas más reportadas
interface ZonaFrecuente {
  key: string;
  cantidad: number;
  lat: number;
  lng: number;
  label: string;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss'],
  imports: [CommonModule, HeaderComponent, FooterComponent]
})
export class EstadisticasComponent implements OnInit {
  mapa: L.Map | null = null;

  totalReportes: number = 0;
  zonasTotales: number = 0;
  densidadPromedio: number = 0;
  zonasFrecuentes: ZonaFrecuente[] = [];

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
        console.log('Datos recibidos:', coordenadas);
        this.totalReportes = coordenadas.length;

        const heatData: [number, number, number][] = coordenadas.map(coord => [
          coord.lat,
          coord.lng,
          5
        ]);

        const heatLayer = (window as any).L.heatLayer(heatData, {
          radius: 20,
          blur: 10,
          maxZoom: 17,
          gradient: {
            0.2: 'blue',
            0.4: 'lime',
            0.6: 'orange',
            0.8: 'red'
          }
        });

        heatLayer.addTo(this.mapa!);

        const zonas = this.agruparPorZona(coordenadas, 2);
        this.zonasTotales = zonas.size;

        let sumaDensidad = 0;
        zonas.forEach(z => sumaDensidad += z.cantidad);
        this.densidadPromedio = parseFloat((sumaDensidad / zonas.size).toFixed(2));

        zonas.forEach((zona) => {
          const marker = L.circleMarker([zona.lat, zona.lng], {
            radius: 2,
            color: 'transparent',
            fillOpacity: 0
          });

          marker.bindTooltip(`Reportes: ${zona.cantidad}`, {
            permanent: false,
            direction: 'top'
          });

          marker.addTo(this.mapa!);
        });

        // Mostrar las 3 zonas más frecuentes
        const zonasOrdenadas = Array.from(zonas.values()).sort((a, b) => b.cantidad - a.cantidad);
        this.zonasFrecuentes = zonasOrdenadas.slice(0, 3).map(z => {
          const label = `Zona cercana a (${z.lat.toFixed(2)}, ${z.lng.toFixed(2)})`;
          return {
            key: `${z.lat},${z.lng}`,
            cantidad: z.cantidad,
            lat: z.lat,
            lng: z.lng,
            label
          };
        });

        this.cdr.detectChanges();
      },
      error => {
        console.error('[ESTADISTICAS] Error al obtener coordenadas:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));
      }
    );
  }

  private agruparPorZona(
    coordenadas: CoordenadaReporte[],
    precision: number = 2
  ): Map<string, { lat: number; lng: number; cantidad: number }> {
    const zonas = new Map<string, { lat: number; lng: number; cantidad: number }>();

    for (const coord of coordenadas) {
      const lat = parseFloat(coord.lat.toFixed(precision));
      const lng = parseFloat(coord.lng.toFixed(precision));
      const key = `${lat},${lng}`;

      if (!zonas.has(key)) {
        zonas.set(key, { lat, lng, cantidad: 1 });
      } else {
        zonas.get(key)!.cantidad += 1;
      }
    }

    return zonas;
  }

  centrarEnZona(lat: number, lng: number): void {
    if (this.mapa) {
      this.mapa.setView([lat, lng], 16);
    }
  }
}
