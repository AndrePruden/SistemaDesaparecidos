import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvistamientoService } from '../../services/avistamiento.service';

@Component({
  selector: 'app-foro-avistamientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './foro-avistamientos.component.html',
  styleUrls: ['./foro-avistamientos.component.scss']
})
export class ForoAvistamientosComponent implements OnInit {
  avistamientos: any[] = [];
  mensaje: string = '';

  constructor(private avistamientosService: AvistamientoService) {}

  ngOnInit(): void {
    this.cargarAvistamientos();
  }

  cargarAvistamientos(): void {
    const idReporte = 1; // Replace with the appropriate idReporte value
    this.avistamientosService.obtenerTodosLosAvistamientos().subscribe({
      next: (data) => {
        this.avistamientos = data;
      },
      error: (error) => {
        console.error('Error al cargar avistamientos:', error);
        this.mensaje = 'No se pudieron cargar los avistamientos.';
      }
    });
    
  }
}
