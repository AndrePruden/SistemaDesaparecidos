import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { ReportesService } from '../../services/reportes.service';
import { Subscription } from 'rxjs'; 
import { FeatureFlagsService } from '../../services/feature-flags.service';

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
  private iconoAvistamientoPersonalizado: any;
  private avistamientoSubscription: Subscription | undefined;

  constructor(
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
    
    if (isPlatformBrowser(this.platformId)) { 
      this.avistamientoSubscription = this.avistamientosService.avistamientoCreado$.subscribe(() => {
          console.log('Se recibió señal de nuevo avistamiento. Recargando lista...');
          this.cargarReportes();
      });
    }

    if (isPlatformBrowser(this.platformId)) {
      this.cargarMapa();
    }
  }

  ngOnDestroy(): void {
    this.limpiarMapa();
    if (this.avistamientoSubscription) {
      this.avistamientoSubscription.unsubscribe();
    }
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
    this.limpiarMapa();
    this.mapa = this.leaflet.map(this.mapContainer.nativeElement).setView([-17.3935, -66.1570], 13);
    this.leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapa);

    this.iconoAvistamientoPersonalizado = this.leaflet.icon({
      iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png', 
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34], 
      shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png', // Sombra del marcador
      shadowSize: [41, 41]
  });

    this.mapa.on('click', (e: any) => {
      this.manejarClickMapa(e);
    });
  }

  private manejarClickMapa(evento: any): void {
    const latlng = evento.latlng;
    this.nuevoAvistamiento.lugar = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    if (this.marcador) {
      this.mapa.removeLayer(this.marcador);
    }
    this.marcador = this.leaflet.marker(latlng, { icon: this.iconoAvistamientoPersonalizado }).addTo(this.mapa);    console.log('Coordenadas seleccionadas:', this.nuevoAvistamiento.lugar);
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
    console.log('Intentando crear un nuevo avistamiento...');
    const emailUsuario = localStorage.getItem('email');
    console.log('📧 Email del usuario:', emailUsuario);

    if (!this.nuevoAvistamiento.personaDesaparecida?.idDesaparecido || !this.nuevoAvistamiento.lugar) {
      console.warn('⚠️ Faltan campos obligatorios');
      this.mensaje = 'Completa todos los campos requeridos';
      return;
    }

    this.featureFlagsService.getFeatureFlag('create-sightings').subscribe({
      next: (flagActivo: boolean) => {
        const puedeCrear = flagActivo || !!emailUsuario;
        console.log('🚦 ¿Autorizado para crear avistamiento?', puedeCrear);

        if (puedeCrear) {
          const fechaFinal = this.nuevoAvistamiento.fecha || new Date(); 
          const emailFinal = emailUsuario || (flagActivo ? 'anonimo@gmail.com' : null);

          if (!emailFinal) {
            console.warn('No se proporcionó un correo válido');
            this.mensaje = 'No tienes permisos para crear avistamientos';
            return;
          }

          const avistamientoData = {
            emailUsuario: emailFinal,
            personaDesaparecida: {
              idDesaparecido: this.nuevoAvistamiento.personaDesaparecida.idDesaparecido
            },
            fecha: fechaFinal,
            ubicacion: this.nuevoAvistamiento.lugar,
            descripcion: this.nuevoAvistamiento.descripcion
          };

          console.log('Datos del avistamiento:', avistamientoData);

          this.avistamientosService.crearAvistamiento(avistamientoData).subscribe({
            next: (response) => {
              console.log('Avistamiento creado con éxito:', response);
              this.mensaje = 'Avistamiento registrado con éxito';
              this.resetForm();
            },
            error: (error) => {
              console.error('Error al crear avistamiento:', error);
              this.mensaje = 'Ocurrió un error al registrar el avistamiento';
            }
          });
        } else {
          console.warn('No tienes permisos para crear avistamientos');
          this.mensaje = 'La funcionalidad de crear avistamientos está deshabilitada';
        }
      },
      error: (error) => {
        console.error('Error al consultar el feature flag:', error);
        this.mensaje = 'Error al verificar permisos para crear avistamiento';
      }
    });
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