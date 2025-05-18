import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvistamientoService } from '../../services/avistamiento.service';
import { ReportesService } from '../../services/reportes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FeatureFlagsService } from '../../services/feature-flags.service';
// No importar * as L desde aquí si usas import() dinámico
// import * as L from 'leaflet';


@Component({
  selector: 'app-form-avistamientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-avistamientos.component.html',
  styleUrls: ['./form-avistamientos.component.scss']
})
export class FormAvistamientosComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  public avistamientoFormData = {
    idAvistamiento: null as number | null,
    fecha: '',
    lugar: '',
    descripcion: '',
    personaDesaparecida: {
      idDesaparecido: null as number | null
    },
  };

  reportes: any[] = [];
  mensaje: string = '';
  isLoading = false;
  isEditing = false;

  private leaflet: any; // Se asignará dinámicamente después del import
  private mapa: any;
  private marcador: any;
  private iconoAvistamientoPersonalizado: any;
  private avistamientoChangeSubscription: Subscription | undefined;
  private isMapInitialized = false;


  constructor(
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService,
    private featureFlagsService: FeatureFlagsService,
    private route: ActivatedRoute,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('[INIT] Form-avistamientos cargado');
    this.cargarReportes();

    // La suscripción a paramMap DEBE quedarse en ngOnInit para reaccionar a los cambios de ruta
    this.route.paramMap.subscribe(params => {
      const avistamientoId = params.get('id');
      if (avistamientoId) {
        this.avistamientoFormData.idAvistamiento = +avistamientoId;
        this.isEditing = true;
        console.log(`Modo Edición: ID ${this.avistamientoFormData.idAvistamiento}`);
        // Cargar datos del avistamiento para edición. Esto iniciará la llamada GET al backend.
        this.cargarAvistamientoParaEdicion(this.avistamientoFormData.idAvistamiento);
      } else {
        this.isEditing = false;
        console.log('Modo Creación');
         // Asegurarse de que el formulario está limpio si no hay ID.
        this.resetForm(); // Esto también limpiará/reseteará el mapa si ya estaba inicializado.
      }
       // La carga del mapa se mueve a ngAfterViewInit
    });

     // Suscribirse a los cambios en los avistamientos para, por ejemplo, resetear el formulario si
     // se crea/actualiza otro avistamiento (aunque no es el comportamiento común).
     // Opcional si no necesitas esta reactividad en el formulario.
     if (isPlatformBrowser(this.platformId)) {
       this.avistamientoChangeSubscription = this.avistamientosService.avistamientoCambiado$.subscribe(() => {
         console.log('🟠 Cambio en avistamientos detectado.');
         // En este componente de formulario, quizás no quieras recargar los datos
         // si el avistamiento actual es el que se acaba de modificar (te rediriges).
         // Si se modifica otro avistamiento, tampoco suele afectar a un formulario de edición.
         // Puedes dejarlo solo para log o eliminar esta suscripción si no la usas.
       });
     }
  }

  ngAfterViewInit(): void {
     console.log('[AfterViewInit] Verificando plataforma e inicializando mapa...');
      // Inicializar el mapa aquí, cuando el contenedor del mapa ya está en el DOM.
      // La función cargarMapa se encarga de importar Leaflet si es necesario.
      if (isPlatformBrowser(this.platformId)) {
          this.cargarMapa();
      } else {
          console.warn('No es un entorno de navegador, el mapa no se inicializará.');
      }
  }


  ngOnDestroy(): void {
    console.log('[DESTROY] Form-avistamientos limpiando...');
    this.limpiarMapa(); // Limpiar el mapa al destruir el componente
     if (this.avistamientoChangeSubscription) {
       this.avistamientoChangeSubscription.unsubscribe();
     }
  }

  private cargarAvistamientoParaEdicion(id: number): void {
    this.isLoading = true; // Mostrar indicador de carga
    console.log(`⏳ Cargando datos de avistamiento con ID: ${id}`);
    // Llamada al servicio para obtener los datos del avistamiento por ID
    // Este SUBSCRIBE es el que está recibiendo el 404 Not Found
    this.avistamientosService.obtenerAvistamientoPorId(id).subscribe(
      (avistamiento) => {
        console.log('✅ Datos de avistamiento para edición cargados:', avistamiento);
        // Rellenar el objeto del formulario con los datos obtenidos
        this.avistamientoFormData.fecha = avistamiento.fecha;
        this.avistamientoFormData.lugar = avistamiento.ubicacion;
        this.avistamientoFormData.descripcion = avistamiento.descripcion;
        this.avistamientoFormData.personaDesaparecida = {
            idDesaparecido: avistamiento.personaDesaparecida?.idDesaparecido || null
        };

        // Si el mapa ya se inicializó (en ngAfterViewInit), actualizar el marcador y la vista con los datos cargados.
        if (this.mapa && this.avistamientoFormData.lugar) {
             const coords = this.avistamientosService.parsearCoords(this.avistamientoFormData.lugar);
             if(coords){
                console.log('📍 Actualizando marcador en mapa con coords cargadas:', coords);
                this.actualizarMarcadorMapa(coords);
                this.mapa.setView(coords, 13); // Centrar el mapa en la ubicación del avistamiento
                this.mapa.invalidateSize(); // Asegurar redibujo después de centrar
             } else {
                 console.warn('Coordenadas del avistamiento no válidas para mostrar en el mapa.');
             }
        }
        // Si el mapa aún no se inicializó (porque la carga de datos fue muy rápida),
        // la lógica en inicializarMapa se encargará de poner el marcador inicial cuando se llame.


        this.isLoading = false; // Ocultar indicador de carga
      },
      (error) => {
        console.error('❌ Error al cargar avistamiento para edición:', error);
         // Manejar errores específicos (como 404) y mostrar un mensaje al usuario
         if (error.status === 404) {
             this.mensaje = 'Avistamiento no encontrado o no tienes permiso para verlo.'; // Mensaje más amigable
             console.warn(`Avistamiento con ID ${id} no encontrado o acceso denegado (404/403) en el backend.`);
             // Opcional: Redirigir a una página de error o a la lista de avistamientos si no se puede cargar
             // this.router.navigate(['/avistamientos']);
         } else {
             this.mensaje = `Error al cargar los datos del avistamiento: ${error.message || 'Error desconocido'}`;
         }
        this.isLoading = false; // Ocultar indicador de carga
      }
    );
  }

 private cargarMapa(): void {
    if (!isPlatformBrowser(this.platformId) || !this.mapContainer?.nativeElement) {
        console.warn('No se puede cargar mapa: No es navegador o mapContainer no está listo.');
        return;
    }
     if (this.isMapInitialized && this.mapa) { // Check this.mapa exists too
         console.log('Mapa ya inicializado.');
         if (!this.isEditing) {
              console.log('Modo Creación detectado en cargarMapa. Limpiando y reinicializando.');
              this.limpiarMapa(); // Limpia el mapa y el marcador
              // Se llama a inicializarMapa abajo después del import si no está inicializado
         } else {
            // Si ya está inicializado y estamos en modo edición,
            // la lógica de cargaAvistamientoParaEdicion ya actualizó el marcador si los datos estaban listos.
            // Solo aseguramos que el mapa se vea bien.
            if (this.mapa) this.mapa.invalidateSize();
            return; // Salir si ya está inicializado y es modo edición
         }
     }

    console.log('⏳ Cargando librería Leaflet dinámicamente...');
    import('leaflet').then(L_module => {
      // >>> MODIFICACIÓN AQUÍ <<<
      this.leaflet = L_module.default || L_module; // Intenta usar .default, si no, usa el módulo principal
      console.log('✅ Leaflet librería cargada:', this.leaflet);
      // Verificar que el objeto asignado tiene la función .map
      if (this.leaflet && typeof this.leaflet.map === 'function') {
          console.log('Found leaflet.map function. Proceeding to initialize.');
          // Solo inicializar si no estaba ya inicializado por una ejecución previa
          if (!this.isMapInitialized) {
             this.inicializarMapa(); // Llamar a inicializar ahora que this.leaflet está asignado y validado
          } else {
            console.log('Mapa ya estaba inicializado, omitiendo inicialización duplicada.');
          }
      } else {
           console.error('❌ Loaded Leaflet module does not contain .map function after checking .default.', this.leaflet);
           this.mensaje = 'Error al cargar la librería del mapa correctamente.';
      }

    }).catch(err => {
      console.error('❌ Error durante la importación dinámica de Leaflet:', err);
      this.mensaje = 'Error al cargar la librería del mapa';
    });
  }


    private inicializarMapa(): void {
    // Añadir una comprobación más robusta
    if (!this.leaflet || typeof this.leaflet.map !== 'function' || !this.mapContainer?.nativeElement) {
        console.warn('No se puede inicializar mapa: this.leaflet, this.leaflet.map, o mapContainer no están listos ANTES de L.map().');
        console.log('Estado de this.leaflet ANTES de L.map:', this.leaflet);
        return;
    }

    // --- Resto de la función inicializarMapa sin cambios ---
    console.log('🚀 Inicializando instancia de mapa Leaflet en', this.mapContainer.nativeElement);
    // ... el resto de tu código para inicializar el mapa ...

    this.mapa.invalidateSize(); // IMPORTANTE para asegurar que el mapa se renderiza correctamente en el contenedor
    this.isMapInitialized = true;
    console.log('✅ Instancia de mapa inicializada correctamente.');

     // Si estamos en modo edición Y los datos ya se cargaron (esto se verifica en cargarAvistamientoParaEdicion),
     // la actualización del marcador y el centrado del mapa se manejan allí *después* de que se llama a inicializarMapa.
     // Sin embargo, si la carga de datos fue MUY RÁPIDA y `avistamientoFormData.lugar` ya está lleno
     // cuando `inicializarMapa` se llama por primera vez (desde `ngAfterViewInit`),
     // esta lógica pondrá el marcador inicial.
     if (this.isEditing && this.avistamientoFormData.lugar) {
          const coords = this.avistamientosService.parsearCoords(this.avistamientoFormData.lugar);
           if(coords){
              console.log('📍 Poniendo marcador inicial (si los datos cargaron rápido) al inicializar mapa con coords:', coords);
              this.actualizarMarcadorMapa(coords);
              this.mapa.setView(coords, 13);
              this.mapa.invalidateSize();
           }
     }
  }

  private manejarClickMapa(evento: any): void {
    const latlng = evento.latlng;
    this.avistamientoFormData.lugar = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    this.actualizarMarcadorMapa([latlng.lat, latlng.lng]);
    console.log('Coordenadas seleccionadas:', this.avistamientoFormData.lugar);
  }

  private actualizarMarcadorMapa(coords: [number, number]): void {
      if (!this.leaflet || !this.mapa) {
          console.warn('No se puede actualizar marcador: Leaflet o mapa no están inicializados.');
          return;
      }
      console.log('Actualizando/añadiendo marcador en:', coords);
      if (this.marcador) {
        this.mapa.removeLayer(this.marcador); // Eliminar marcador existente
      }
      // Usar this.leaflet para crear el nuevo marcador
      this.marcador = this.leaflet.marker(coords, { icon: this.iconoAvistamientoPersonalizado }).addTo(this.mapa);
      console.log('Marcador actualizado.');
  }

   private limpiarMapa(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    console.log('Limpiando mapa...');
    if (this.marcador) {
      this.marcador.remove(); // Eliminar marcador de la instancia del mapa
      this.marcador = null;
      console.log('Marcador limpiado.');
    }

    if (this.mapa) {
      this.mapa.off(); // Quitar todos los listeners
      this.mapa.remove(); // Eliminar la instancia del mapa
      this.mapa = null;
      this.isMapInitialized = false; // Reiniciar la bandera
      console.log('Instancia de mapa limpiada.');
    }
  }

  cargarReportes(): void {
    console.log('⏳ Cargando reportes...');
    this.reportesService.obtenerReportes().subscribe(
      (data) => {
        this.reportes = data;
        console.log('✅ Reportes cargados:', this.reportes);
      },
      (error) => {
        console.error('❌ Error al cargar reportes:', error);
        this.mensaje = 'Error al cargar los reportes disponibles';
      }
    );
  }

   onSubmit(): void {
    if (this.isEditing && this.avistamientoFormData.idAvistamiento !== null) {
      this.actualizarAvistamiento(this.avistamientoFormData.idAvistamiento);
    } else {
      this.crearAvistamiento();
    }
  }

  crearAvistamiento(): void {
    console.log('Intentando crear un nuevo avistamiento...');
    const emailUsuario = localStorage.getItem('email');
    console.log('📧 Email del usuario:', emailUsuario);

    if (!emailUsuario) {
         console.warn('⚠️ Usuario no autenticado para crear avistamiento.');
         this.mensaje = 'Debes estar autenticado para crear un avistamiento';
         return;
    }
    if (!this.avistamientoFormData.personaDesaparecida?.idDesaparecido || !this.avistamientoFormData.lugar) {
      console.warn('⚠️ Faltan campos obligatorios (Reporte o Lugar)');
      this.mensaje = 'Completa el Reporte y selecciona la Ubicación en el mapa';
      return;
    }

    const fechaFinal = this.avistamientoFormData.fecha || new Date().toISOString().split('T')[0];
    const avistamientoData = {
      emailUsuario: emailUsuario, // Enviando email en el payload (según tu lógica backend actual)
      personaDesaparecida: {
        idDesaparecido: this.avistamientoFormData.personaDesaparecida.idDesaparecido
      },
      fecha: fechaFinal,
      ubicacion: this.avistamientoFormData.lugar,
      descripcion: this.avistamientoFormData.descripcion
    };

    console.log('Datos para CREAR avistamiento:', avistamientoData);

    this.avistamientosService.crearAvistamiento(avistamientoData).subscribe(
      (response) => {
        console.log('✅ Avistamiento creado con éxito:', response);
        this.mensaje = 'Avistamiento registrado con éxito';
        // Redirigir a la lista después de crear
        this.router.navigate(['/avistamientos']);
        // Opcional: resetear el formulario después de crear si no rediriges
        // this.resetForm();
      },
      (error) => {
        console.error('❌ Error al crear avistamiento:', error);
        this.mensaje = `Error al registrar el avistamiento: ${error.message || 'Error desconocido'}. Revisa tu autenticación y configuración backend.`;
      }
    );
  }

  actualizarAvistamiento(id: number): void {
     console.log(`Intentando actualizar avistamiento con ID: ${id}`);

     const emailUsuario = localStorage.getItem('email');
     if (!emailUsuario) {
         console.warn('⚠️ Usuario no autenticado para actualizar avistamiento.');
         this.mensaje = 'Debes estar autenticado para actualizar un avistamiento';
         return;
     }

     if (!this.avistamientoFormData.personaDesaparecida?.idDesaparecido || !this.avistamientoFormData.lugar) {
      console.warn('⚠️ Faltan campos obligatorios para actualizar (Reporte o Lugar)');
      this.mensaje = 'Completa el Reporte y selecciona la Ubicación en el mapa';
      return;
    }

    const fechaFinal = this.avistamientoFormData.fecha || new Date().toISOString().split('T')[0];

     const avistamientoData = {
      // No es necesario enviar emailUsuario en el payload para actualizar si el backend verifica por token
      // Pero si tu backend *insiste* en recibir el email en el body para PUT (mala práctica), tendrías que añadirlo aquí.
      // emailUsuario: emailUsuario, // <-- Añadir solo si el backend lo requiere en el body para PUT
      personaDesaparecida: {
        idDesaparecido: this.avistamientoFormData.personaDesaparecida.idDesaparecido
      },
      fecha: fechaFinal,
      ubicacion: this.avistamientoFormData.lugar,
      descripcion: this.avistamientoFormData.descripcion
    };

    console.log(`Datos para ACTUALIZAR avistamiento ${id}:`, avistamientoData);

    // Este SUBSCRIBE es el que está recibiendo el error CORS (o 404 si el endpoint PUT no existe)
    this.avistamientosService.actualizarAvistamiento(id, avistamientoData).subscribe(
      (response) => {
        console.log('✅ Avistamiento actualizado con éxito:', response);
        this.mensaje = 'Avistamiento actualizado con éxito';
        this.router.navigate(['/avistamientos']); // Redirigir a la lista después de actualizar
      },
      (error) => {
        console.error('❌ Error al actualizar avistamiento:', error);
        // Mostrar mensaje de error relevante (CORS, 404, 403, 500, etc.)
        this.mensaje = `Error al actualizar avistamiento: ${error.message || 'Error desconocido'}. Verifica la configuración CORS en el backend y tu autenticación.`;
      }
    );
  }


  resetForm(): void {
     console.log('Reseteando formulario...');
    this.avistamientoFormData = {
      idAvistamiento: null,
      fecha: '',
      lugar: '',
      descripcion: '',
      personaDesaparecida: {
        idDesaparecido: null
      }
    };
    this.isEditing = false;

    // Limpiar mapa solo si ya estaba inicializado para evitar errores
    if (this.isMapInitialized) {
        this.limpiarMapa(); // Limpia el mapa y el marcador
        // Si quieres que el mapa vuelva a aparecer inmediatamente vacío después de un reset,
        // llama a cargarMapa() aquí.
        this.cargarMapa(); // Re-inicializa el mapa a la vista por defecto
    }
    this.mensaje = '';
  }
}