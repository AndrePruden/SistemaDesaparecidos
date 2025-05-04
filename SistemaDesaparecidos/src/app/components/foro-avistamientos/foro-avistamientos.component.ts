import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  idReporte!: number;
  avistamientoSeleccionado: any = null;
  mapa: any = null;

  constructor(
    private avistamientoService: AvistamientoService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.idReporte = +this.route.snapshot.paramMap.get('id')!;
    console.log('ID del reporte:', this.idReporte);
    this.cargarAvistamientos();
  }

  ngOnDestroy(): void {
    this.limpiarMapa();
  }

  cargarAvistamientos(): void {
    this.avistamientoService.obtenerTodosLosAvistamientos().subscribe({
      next: (data) => {
        console.log('Avistamientos recibidos:', data);
        this.avistamientos = data;
        if (data.length === 0) {
          this.mensaje = 'No hay avistamientos reportados para este caso.';
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
    
    setTimeout(async () => {
      if (isPlatformBrowser(this.platformId)) {
        const L = await import('leaflet');
        const divMapa = document.getElementById('mapaAvistamiento');

        if (divMapa) {
          this.limpiarMapa();
          
          const coords = this.parsearCoordenadas(avistamiento.ubicacion);
          
          this.mapa = L.map('mapaAvistamiento', {
            center: coords || [0, 0],
            zoom: 15
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(this.mapa);

          if (coords) {
            const customIcon = L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34]
            });

            L.marker(coords, { icon: customIcon })
              .addTo(this.mapa)
              .bindPopup(`
                <b>${avistamiento.personaDesaparecida?.nombre || 'Desconocido'}</b><br>
                <b>Fecha:</b> ${new Date(avistamiento.fecha).toLocaleDateString()}<br>
                <b>Lugar:</b> ${avistamiento.ubicacion}<br>
                <b>Descripción:</b> ${avistamiento.descripcion || 'No hay descripción disponible'}
              `);
          }
        }
      }
    }, 0);
  }

  parsearCoordenadas(coordenadasStr: string): [number, number] | null {
    if (!coordenadasStr) return null;
    
    const parts = coordenadasStr.split(',').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
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
    this.limpiarMapa();
  }
}