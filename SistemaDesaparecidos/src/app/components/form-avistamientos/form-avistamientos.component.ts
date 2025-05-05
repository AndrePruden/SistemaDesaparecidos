import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { ReportesService } from '../../services/reportes.service';

@Component({
  selector: 'app-form-avistamientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-avistamientos.component.html',
  styleUrls: ['./form-avistamientos.component.scss']
})
export class FormAvistamientosComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  nuevoAvistamiento = {
    fecha: '',
    lugar: '',
    descripcion: '',
    personaDesaparecida: {
      idDesaparecido: null as number | null
    }
  };

  reportes: any[] = [];
  mensaje: string = '';

  private leaflet: any;
  private mapa: any;
  private marcador: any;

  constructor(
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
    
    if (isPlatformBrowser(this.platformId)) {
      this.cargarMapa();
    }
  }

  ngOnDestroy(): void {
    this.limpiarMapa();
  }

  private cargarMapa(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('leaflet').then((L) => {
      this.leaflet = L;
      this.inicializarMapa();
    }).catch(err => {
      console.error('Error al cargar Leaflet:', err);
    });
  }

  private inicializarMapa(): void {
    if (!this.mapContainer?.nativeElement) return;

    // Limpiar mapa existente
    this.limpiarMapa();

    // Configurar iconos por defecto (para evitar problemas con los marcadores)
    this.leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
    });

    // Crear mapa
    this.mapa = this.leaflet.map(this.mapContainer.nativeElement).setView([-17.3935, -66.1570], 13);

    // Añadir capa base
    this.leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapa);

    // Configurar evento de clic
    this.mapa.on('click', (e: any) => {
      this.manejarClickMapa(e);
    });
  }

  private manejarClickMapa(evento: any): void {
    const latlng = evento.latlng;
    this.nuevoAvistamiento.lugar = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;

    // Eliminar marcador existente
    if (this.marcador) {
      this.mapa.removeLayer(this.marcador);
    }

    // Añadir nuevo marcador
    this.marcador = this.leaflet.marker(latlng).addTo(this.mapa);
    console.log('Coordenadas seleccionadas:', this.nuevoAvistamiento.lugar);
  }

  private limpiarMapa(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.marcador) {
      this.marcador.remove();
      this.marcador = null;
    }

    if (this.mapa) {
      this.mapa.off();
      this.mapa.remove();
      this.mapa = null;
    }
  }

  cargarReportes(): void {
    this.reportesService.obtenerReportes().subscribe({
      next: (data) => {
        this.reportes = data;
        console.log('Reportes cargados:', this.reportes);
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.mensaje = 'Error al cargar los reportes disponibles';
      }
    });
  }

  crearAvistamiento(): void {
    if (!this.validarFormulario()) return;

    const avistamientoData = {
      emailUsuario: localStorage.getItem('email'),
      personaDesaparecida: {
        idDesaparecido: this.nuevoAvistamiento.personaDesaparecida.idDesaparecido
      },
      fecha: this.nuevoAvistamiento.fecha,
      ubicacion: this.nuevoAvistamiento.lugar,
      descripcion: this.nuevoAvistamiento.descripcion
    };

    this.avistamientosService.crearAvistamiento(avistamientoData).subscribe({
      next: (response) => {
        console.log('Avistamiento creado:', response);
        this.mensaje = 'Avistamiento registrado con éxito';
        this.resetForm();
      },
      error: (error) => {
        console.error('Error al crear avistamiento:', error);
        this.mensaje = 'Error al registrar el avistamiento';
      }
    });
  }

  private validarFormulario(): boolean {
    if (!localStorage.getItem('email')) {
      this.mensaje = 'Debes iniciar sesión para reportar un avistamiento';
      return false;
    }

    if (!this.nuevoAvistamiento.personaDesaparecida.idDesaparecido) {
      this.mensaje = 'Debes seleccionar un reporte válido';
      return false;
    }

    if (!this.nuevoAvistamiento.lugar) {
      this.mensaje = 'Debes seleccionar una ubicación en el mapa';
      return false;
    }

    return true;
  }

  resetForm(): void {
    this.nuevoAvistamiento = {
      fecha: '',
      lugar: '',
      descripcion: '',
      personaDesaparecida: {
        idDesaparecido: null
      }
    };

    this.limpiarMapa();
    this.mensaje = '';
  }
}