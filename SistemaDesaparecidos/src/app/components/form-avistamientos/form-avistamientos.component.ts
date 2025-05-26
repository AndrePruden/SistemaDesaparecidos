import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { ReportesService } from '../../services/reportes.service';
import { Subscription } from 'rxjs'; 
import { FeatureFlagsService } from '../../services/feature-flags.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-form-avistamientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-avistamientos.component.html',
  styleUrls: ['./form-avistamientos.component.scss']
})
export class FormAvistamientosComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

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

  private mapa: L.Map | null = null;
  private marcador: L.Marker | null = null;
  private avistamientoSubscription: Subscription | undefined;

  constructor(
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('Form-Avistamiento: Componente construido');
  }

  ngOnInit(): void {
    console.log('Form-Avistamiento: ngOnInit iniciado');
    this.cargarReportes();

    if (isPlatformBrowser(this.platformId)) {
      console.log('Form-Avistamiento: Navegador detectado, configurando suscripción');
      this.avistamientoSubscription = this.avistamientosService.avistamientoCreado$.subscribe(() => {
        console.log('Form-Avistamiento: Evento de nuevo avistamiento recibido');
        this.cargarReportes();
      });
    } else {
      console.warn('Form-Avistamiento: No se ejecuta en navegador (SSR)');
    }
  }

  ngAfterViewInit(): void {
    console.log('Form-Avistamiento: ngAfterViewInit iniciado');
    if (isPlatformBrowser(this.platformId)) {
      console.log('Form-Avistamiento: Inicializando mapa...');
      this.inicializarMapa();
    }
  }

  ngOnDestroy(): void {
    console.log('Form-Avistamiento: ngOnDestroy iniciado');
    this.limpiarMapa();
    
    if (this.avistamientoSubscription) {
      console.log('Form-Avistamiento: Cancelando suscripción');
      this.avistamientoSubscription.unsubscribe();
    }
  }

  private inicializarMapa(): void {
    console.log('Form-Avistamiento Mapa: Iniciando inicialización');
    
    if (!this.mapContainer?.nativeElement) {
      console.error('Form-Avistamiento Mapa: ERROR - Elemento del contenedor no encontrado');
      return;
    }

    console.log('Form-Avistamiento Mapa: Contenedor encontrado', this.mapContainer.nativeElement);
    
    // Asegurar estilos directamente
    const container = this.mapContainer.nativeElement;
    container.style.height = '400px';
    container.style.width = '100%';
    container.style.margin = '1rem 0';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #ddd';
    
    console.log('Form-Avistamiento Mapa: Estilos aplicados');

    this.limpiarMapa();
    console.log('Form-Avistamiento Mapa: Mapa anterior limpiado');

    // Crear nuevo icono con L.icon
    console.log('Form-Avistamiento Mapa: Configurando icono customizado');
    const iconCustom = L.icon({
      iconUrl: 'assets/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'assets/images/marker-shadow.png',
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    });

    // Crear mapa
    console.log('Form-Avistamiento Mapa: Creando instancia de mapa');
    this.mapa = L.map(container, {
      center: [-17.3935, -66.1570],
      zoom: 13,
      zoomControl: true,
      preferCanvas: true // Mejor rendimiento para muchos marcadores
    });

    console.log('Form-Avistamiento Mapa: Añadiendo capa de tiles');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 3,
      noWrap: true
    }).addTo(this.mapa);

    // Evento de clic
    console.log('Form-Avistamiento Mapa: Configurando evento de clic');
    this.mapa.on('click', (e: L.LeafletMouseEvent) => {
      console.log('Form-Avistamiento Mapa: Click detectado en coordenadas', e.latlng);
      const latlng = e.latlng;
      this.nuevoAvistamiento.lugar = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
      
      if (this.marcador) {
        console.log('Form-Avistamiento Mapa: Eliminando marcador anterior');
        this.mapa?.removeLayer(this.marcador);
      }
      
      console.log('Form-Avistamiento Mapa: Añadiendo nuevo marcador');
      this.marcador = L.marker(latlng, { icon: iconCustom }).addTo(this.mapa!);
    });

    // Forzar redimensionamiento
    setTimeout(() => {
      console.log('Form-Avistamiento Mapa: Forzando invalidateSize');
      this.mapa?.invalidateSize();
      console.log('Form-Avistamiento Mapa: Mapa completamente cargado y visible');
    }, 300);

    console.log('Form-Avistamiento Mapa: Inicialización completada');
  }

  private limpiarMapa(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Form-Avistamiento Mapa: No en navegador, omitiendo limpieza');
      return;
    }

    console.log('Form-Avistamiento Mapa: Iniciando limpieza');

    if (this.marcador) {
      console.log('Form-Avistamiento Mapa: Eliminando marcador');
      this.mapa?.removeLayer(this.marcador);
      this.marcador = null;
    }

    if (this.mapa) {
      console.log('Form-Avistamiento Mapa: Eliminando mapa');
      this.mapa.off();
      this.mapa.remove();
      this.mapa = null;
    }

    console.log('Form-Avistamiento Mapa: Limpieza completada');
  }

  cargarReportes(): void {
    console.log('Form-Avistamiento: Cargando reportes...');
    this.reportesService.obtenerReportes().subscribe({
      next: (data) => {
        console.log('Form-Avistamiento: Reportes cargados correctamente', data);
        this.reportes = data;
      },
      error: (error) => {
        console.error('Form-Avistamiento: Error al cargar reportes', error);
        this.mensaje = 'Error al cargar los reportes disponibles';
      }
    });
  }

  crearAvistamiento(): void {
    console.log('Form-Avistamiento: Intentando crear avistamiento...');
    const emailUsuario = localStorage.getItem('email');
    console.log('Form-Avistamiento: Email usuario', emailUsuario);

    if (!this.nuevoAvistamiento.personaDesaparecida?.idDesaparecido || !this.nuevoAvistamiento.lugar) {
      console.warn('Form-Avistamiento: Campos obligatorios faltantes');
      this.mensaje = 'Completa todos los campos requeridos';
      return;
    }

    console.log('Form-Avistamiento: Verificando feature flag...');
    this.featureFlagsService.getFeatureFlag('create-sightings').subscribe({
      next: (flagActivo: boolean) => {
        const puedeCrear = flagActivo || !!emailUsuario;
        console.log('Form-Avistamiento: Permisos para crear?', puedeCrear);

        if (puedeCrear) {
          const fechaFinal = this.nuevoAvistamiento.fecha || new Date().toISOString().split('T')[0];
          const emailFinal = emailUsuario || (flagActivo ? 'anonimo@gmail.com' : null);

          if (!emailFinal) {
            console.warn('Form-Avistamiento: Email no válido');
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

          console.log('Form-Avistamiento: Datos a enviar', avistamientoData);

          this.avistamientosService.crearAvistamiento(avistamientoData).subscribe({
            next: (response) => {
              console.log('Form-Avistamiento: Avistamiento creado con éxito', response);
              this.mensaje = 'Avistamiento registrado con éxito';
              this.resetForm();
            },
            error: (error) => {
              console.error('Form-Avistamiento: Error al crear avistamiento', error);
              this.mensaje = 'Ocurrió un error al registrar el avistamiento';
            }
          });
        } else {
          console.warn('Form-Avistamiento: Permisos insuficientes');
          this.mensaje = 'La funcionalidad de crear avistamientos está deshabilitada';
        }
      },
      error: (error) => {
        console.error('Form-Avistamiento: Error al verificar feature flag', error);
        this.mensaje = 'Error al verificar permisos para crear avistamiento';
      }
    });
  }

  resetForm(): void {
    console.log('Form-Avistamiento: Reseteando formulario');
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
