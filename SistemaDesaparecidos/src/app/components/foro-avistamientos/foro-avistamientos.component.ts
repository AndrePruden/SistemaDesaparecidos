import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
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
  idReporte!: number;

  constructor(private avistamientosService: AvistamientoService , private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.idReporte = +this.route.snapshot.paramMap.get('id')!;
    console.log('ID del reporte:', this.idReporte);
    this.cargarAvistamientos();
  }

  cargarAvistamientos(): void {
    const idReporte = 1; 
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
