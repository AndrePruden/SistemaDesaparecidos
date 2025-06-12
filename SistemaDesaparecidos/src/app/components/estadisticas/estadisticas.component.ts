import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasService, CoordenadaReporte } from '../../services/estadisticas.service';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css']
})
export class EstadisticasComponent implements OnInit {
  coordenadas: CoordenadaReporte[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit(): void {
    this.estadisticasService.obtenerCoordenadas().subscribe({
      next: (coords) => {
        this.coordenadas = coords;
        this.cargando = false;
        console.log('📍 Coordenadas cargadas:', coords);
      },
      error: (err) => {
        console.error('❌ Error al obtener coordenadas:', err);
        this.error = 'No se pudieron cargar los datos de coordenadas.';
        this.cargando = false;
      }
    });
  }
}
