import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { AvistamientoService } from '../../services/avistamiento.service';

@Component({
  selector: 'app-cards-reportes',
  templateUrl: './cards-reportes.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./cards-reportes.component.scss']
})
export class CardsReportesComponent implements OnInit {
  reportes: any[] = []; 
  reportesFiltrados: any[] = []; 
  nombreBusqueda: string = '';
  edadBusqueda: number | null = null;
  lugarBusqueda: string = '';
  fechaBusqueda: string = '';

  constructor(private reportesService: ReportesService,
    private avistamientoService: AvistamientoService
  ) {}

  ngOnInit(): void {
    console.log('[INIT] Iniciando componente de reportes...');
    this.obtenerReportes();
  }

  obtenerReportes(): void {
    console.log('[HTTP] Solicitando reportes...');
    this.reportesService.obtenerReportes().subscribe(
      (data) => {
        console.log('[HTTP] Reportes recibidos:', data);
        this.reportes = data;
        this.reportesFiltrados = data;
      },
      (error) => {
        console.error('[ERROR] Error al obtener reportes:', error);
      }
    );
  }

  filtrarReportes() {
    console.log('[FILTRO] Aplicando filtros: ', {
      nombre: this.nombreBusqueda,
      edad: this.edadBusqueda,
      lugar: this.lugarBusqueda,
      fecha: this.fechaBusqueda
    });
    this.reportesFiltrados = this.reportes.filter(reporte => {
      const nombreCoincide = !this.nombreBusqueda || reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase());
      const edadCoincide = !this.edadBusqueda || reporte.edad === this.edadBusqueda;
      const lugarCoincide = !this.lugarBusqueda || reporte.lugarDesaparicion.toLowerCase().includes(this.lugarBusqueda.toLowerCase());
      const fechaCoincide = !this.fechaBusqueda || reporte.fechaDesaparicion === this.fechaBusqueda;

      return nombreCoincide && edadCoincide && lugarCoincide && fechaCoincide;
    });
    console.log('[FILTRO] Resultados filtrados:', this.reportesFiltrados);
  }

  limpiarFiltros() {
    console.log('[FILTRO] Limpiando filtros...');
    this.nombreBusqueda = '';
    this.edadBusqueda = null;
    this.lugarBusqueda = '';
    this.fechaBusqueda = '';
    this.filtrarReportes(); 
  }

  mostrarPopup(reporte: any) {
    console.log('[POPUP] Solicitando último avistamiento para el reporte:', reporte.idDesaparecido);
    this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).subscribe(avistamiento => {
      console.log('[POPUP] Último avistamiento recibido:', avistamiento);
      reporte.ultimoAvistamiento = avistamiento;
      reporte.mostrarPopup = true;
    }, error => {
      console.error('[ERROR] Error al obtener último avistamiento:', error);
    });
  }

  cerrarPopup(reporte: any): void {
    console.log('[POPUP] Cerrando popup del reporte:', reporte.idDesaparecido);
    reporte.mostrarPopup = false;
  }
}
