import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cards-reportes',
  templateUrl: './cards-reportes.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./cards-reportes.component.scss']
})
export class CardsReportesComponent implements OnInit {
  reportes: any[] = []; // Array de reportes completos
  reportesFiltrados: any[] = []; // Array de reportes filtrados
  nombreBusqueda: string = '';
  edadBusqueda: number | null = null;
  lugarBusqueda: string = '';
  fechaBusqueda: string = '';

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.obtenerReportes();
  }

  obtenerReportes(): void {
    this.reportesService.obtenerReportes().subscribe(
      (data) => {
        this.reportes = data;
        this.reportesFiltrados = data;
      },
      (error) => {
        console.error('Error al obtener reportes:', error);
      }
    );
  }

  filtrarReportes() {
    this.reportesFiltrados = this.reportes.filter(reporte => {
      const nombreCoincide = !this.nombreBusqueda || reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());
      const edadCoincide = !this.edadBusqueda || reporte.edad === this.edadBusqueda;
      const lugarCoincide = !this.lugarBusqueda || reporte.lugarDesaparicion.toLowerCase().includes(this.lugarBusqueda.toLowerCase());
      const fechaCoincide = !this.fechaBusqueda || reporte.fechaDesaparicion === this.fechaBusqueda;

      return nombreCoincide && edadCoincide && lugarCoincide && fechaCoincide;
    });
  }
}
