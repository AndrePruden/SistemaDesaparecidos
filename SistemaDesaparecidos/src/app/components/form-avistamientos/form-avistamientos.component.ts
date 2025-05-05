import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class FormAvistamientosComponent implements OnInit {
  nuevoAvistamiento: any = {
    fecha: '',
    lugar: '',
    descripcion: '',
    personaDesaparecida: {
      idDesaparecido: null
    }
  };

  reportes: any[] = [];
  mensaje: string = '';

  // Nuevas propiedades para el mapa
  leaflet: any;
  mapa: any;
  marcador: any;

  constructor(
    private avistamientosService: AvistamientoService,
    private reportesService: ReportesService
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
    this.cargarMapa();
  }

  cargarMapa(): void {
    // Cargar el módulo de Leaflet
    import('leaflet').then((leafletModule) => {
      this.leaflet = leafletModule;
      this.mapa = this.leaflet.map('mapaAvistamiento').setView([-17.3935, -66.1570], 13);

      // Cargar las capas del mapa
      this.leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.mapa);

      // Crear un ícono para el marcador
      const iconoMarcador = this.leaflet.icon({
        iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
      });

      // Evento de clic en el mapa
      this.mapa.on('click', (e: any) => {
        const latlng = e.latlng;
        this.nuevoAvistamiento.lugar = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;

        // Si ya hay marcador, lo eliminamos
        if (this.marcador) {
          this.mapa.removeLayer(this.marcador);
        }

        // Añadir un nuevo marcador con el ícono personalizado
        this.marcador = this.leaflet.marker(latlng, { icon: iconoMarcador }).addTo(this.mapa);
        console.log('📍 Coordenadas seleccionadas:', this.nuevoAvistamiento.lugar);
      });
    });
  }

  cargarReportes(): void {
    this.reportesService.obtenerReportes().subscribe({
      next: (data) => {
        this.reportes = data;
        console.log('Reportes cargados:', this.reportes);
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
      }
    });
  }

  crearAvistamiento(): void {
    const emailUsuario = localStorage.getItem('email');

    if (!emailUsuario) {
      this.mensaje = 'Debes iniciar sesión para reportar un avistamiento';
      console.error(this.mensaje);
      return;
    }

    if (!this.nuevoAvistamiento.personaDesaparecida.idDesaparecido) {
      this.mensaje = 'Debes seleccionar un reporte válido';
      console.error(this.mensaje);
      return;
    }

    // Asegúrate de que las coordenadas están en el formato correcto
    if (!this.nuevoAvistamiento.lugar) {
      this.mensaje = 'Debes seleccionar una ubicación en el mapa';
      console.error(this.mensaje);
      return;
    }

    const avistamientoData = {
      emailUsuario: emailUsuario,
      personaDesaparecida: {
        idDesaparecido: this.nuevoAvistamiento.personaDesaparecida.idDesaparecido
      },
      fecha: this.nuevoAvistamiento.fecha,
      ubicacion: this.nuevoAvistamiento.lugar, // Asegúrate que esto coincide con lo que espera el backend
      descripcion: this.nuevoAvistamiento.descripcion
    };

    console.log('Datos del avistamiento a enviar:', avistamientoData);

    this.avistamientosService.crearAvistamiento(avistamientoData).subscribe({
      next: (response) => {
        console.log('Avistamiento creado:', response);
        this.mensaje = 'Avistamiento registrado con éxito';
        this.resetForm();
      },
      error: (error) => {
        console.error('Error al crear avistamiento:', error);
        this.mensaje = 'Error al registrar el avistamiento: ' + (error.error?.message || error.message);
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
       // Si ya hay marcador, lo eliminamos
       if (this.marcador) {
        this.mapa.removeLayer(this.marcador);
      }
  }
}