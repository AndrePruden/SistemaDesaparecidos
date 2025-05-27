import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { RouterModule } from '@angular/router';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { MapService } from '../../services/map.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

interface Reporte {
  imagen: string;
  idDesaparecido: number;
  nombre: string;
  edad: number;
  lugarDesaparicion: string;
  fechaDesaparicion: string;
  lugarDesaparicionLegible: string;
  ultimoAvistamiento?: Avistamiento | null;
  descripcion: string;
  estado: boolean;
  emailReportaje: string;
}

interface Avistamiento {
  ubicacion: string;
  fecha: string;
  descripcion: string;
}

@Component({
  selector: 'app-cards-reportes',
  templateUrl: './cards-reportes.component.html',
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./cards-reportes.component.scss']
})
export class CardsReportesComponent implements OnInit {
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  nombreBusqueda = '';
  edadBusqueda: number | null = null;
  lugarBusqueda = '';
  fechaBusqueda = '';
  mapas: { [key: string]: L.Map } = {}; // Cambiado a tipo L.Map
  reporteSeleccionado: Reporte | null = null;
  emailUsuarioActual: string | null = null;

  constructor(
    private reportesService: ReportesService,
    private avistamientoService: AvistamientoService,
    private geocodificacionService: GeocodificacionService,
    private mapService: MapService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.emailUsuarioActual = localStorage.getItem('email');
    console.log('[INIT] Componente cargado');
    this.obtenerReportes();
    if (isPlatformBrowser(this.platformId)) {
      console.log('[INIT] Componente cargado');
      this.obtenerReportes();
    }
  }

  obtenerReportes(): void {
    this.reportesService.obtenerReportes().subscribe({
      next: (data: Reporte[]) => {
        const emailUsuario = this.emailUsuarioActual;
        this.reportes = data.filter(reporte =>
          reporte.estado == true || reporte.emailReportaje === emailUsuario
        );

        this.reportesFiltrados = [...this.reportes];
        this.setDireccionesReportes();
        this.cargarUltimosAvistamientos();

        console.log('[DATOS FILTRADOS]', this.reportes);
      },
      error: (err) => console.error('[ERROR] al obtener reportes:', err)
    });
  }

  setDireccionesReportes(): void {
    this.reportesFiltrados.forEach(reporte => {
      const coords = this.mapService.parsearCoords(reporte.lugarDesaparicion);
      if (coords) {
        this.geocodificacionService.obtenerDireccionDesdeCoordenadas(coords[0], coords[1]).subscribe({
          next: direccion => reporte.lugarDesaparicionLegible = direccion,
          error: () => reporte.lugarDesaparicionLegible = 'Ubicación desconocida'
        });
      } else {
        reporte.lugarDesaparicionLegible = reporte.lugarDesaparicion;
      }
    });
  }

  cargarUltimosAvistamientos(): void {
    this.reportesFiltrados.forEach(reporte => {
      this.avistamientoService.obtenerUltimoAvistamiento(reporte.idDesaparecido).subscribe({
        next: avistamiento => {
          if (avistamiento) {
            reporte.ultimoAvistamiento = avistamiento;
          } else {
            console.log(`No hay avistamiento para el reporte ID ${reporte.idDesaparecido}`);
            reporte.ultimoAvistamiento = null;
          }
        },
        error: err => {
          console.error(`Error real al obtener avistamiento para el reporte ID ${reporte.idDesaparecido}:`, err);
          reporte.ultimoAvistamiento = null;
        }
      });
    });
  }

  async mostrarPopup(reporte: Reporte): Promise<void> {
    try {
      this.reporteSeleccionado = { ...reporte };
      const coords = this.mapService.parsearCoords(reporte.lugarDesaparicion);

      if (coords) {
        await this.renderizarMapa(reporte, coords);
      }
    } catch (error) {
      console.error('[ERROR] mostrando popup:', error);
    }
  }

  private async renderizarMapa(reporte: Reporte, coords: [number, number]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    // Espera a que Angular renderice el popup
    await new Promise(resolve => setTimeout(resolve, 50));

    const mapaId = 'mapaPopup-' + reporte.idDesaparecido;
    const divMapa = document.getElementById(mapaId);
    
    if (!divMapa) {
      console.error('❌ Div del mapa no encontrado:', mapaId);
      return;
    }

    // Asegura dimensiones
    divMapa.style.height = '400px';
    divMapa.style.width = '100%';

    // Limpia mapa existente
    if (this.mapas[mapaId]) {
      this.mapService.eliminarMapa(this.mapas[mapaId]);
      delete this.mapas[mapaId];
    }

    // Crea el mapa usando el servicio actualizado
    const mapa = this.mapService.crearMapa(mapaId, coords);
    if (!mapa) {
      console.error('No se pudo crear el mapa');
      return;
    }

    this.mapas[mapaId] = mapa;

    // Añade marcador principal
    this.mapService.agregarMarcador(
      mapa,
      coords,
      'red',
      'Lugar de desaparición',
      this.reporteSeleccionado?.lugarDesaparicionLegible || ''
    );

    // Manejo de avistamientos
    if (this.reporteSeleccionado?.ultimoAvistamiento?.ubicacion) {
      const coordsAvistamiento = this.mapService.parsearCoords(
        this.reporteSeleccionado.ultimoAvistamiento.ubicacion
      );
      if (coordsAvistamiento) {
        this.mapService.agregarMarcador(
          mapa,
          coordsAvistamiento,
          'blue',
          'Último avistamiento',
          `Fecha: ${this.reporteSeleccionado.ultimoAvistamiento.fecha}`
        );
        this.mapService.ajustarVista(mapa, coords, coordsAvistamiento);
      }
    }

    // Fuerza redibujado
    setTimeout(() => {
      mapa.invalidateSize();
      console.log('✅ Mapa creado correctamente');
    }, 100);
  }

  cerrarPopup(): void {
    this.reporteSeleccionado = null;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/470100848/es/vector/macho-icono-de-perfil-blanco-en-fondo-azul.jpg?s=612x612&w=0&k=20&c=HVwuxvS7hDgG6qOZXRXvsHbLVRKP5zrIllm09LWMgjc=';
  }

  puedeArchivar(reporte: Reporte): boolean {
    return this.emailUsuarioActual === reporte.emailReportaje && reporte.estado;
  }

  archivarReporte(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje: '¿Estás seguro de archivar este reporte?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.reportesService.archivarReporte(id).subscribe({
          next: (response) => {
            console.log('Respuesta del backend:', response);
            this.snackBar.open('Reporte archivado con éxito', 'Cerrar', { duration: 3000 });
            this.obtenerReportes();
          },
          error: (err) => {
            console.log('Respuesta del backend:', err);
            this.snackBar.open('Error al archivar el reporte', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }
  
  filtrarReportes(): void {
    this.reportesFiltrados = this.reportes.filter(reporte => {
      return (!this.nombreBusqueda || reporte.nombre.toLowerCase().includes(this.nombreBusqueda.toLowerCase())) &&
             (!this.edadBusqueda || reporte.edad === this.edadBusqueda) &&
             (!this.lugarBusqueda || reporte.lugarDesaparicionLegible.toLowerCase().includes(this.lugarBusqueda.toLowerCase())) &&
             (!this.fechaBusqueda || reporte.fechaDesaparicion === this.fechaBusqueda);
    });
  }

  limpiarFiltros(): void {
    this.nombreBusqueda = '';
    this.edadBusqueda = null;
    this.lugarBusqueda = '';
    this.fechaBusqueda = '';
    this.filtrarReportes();
  }
}