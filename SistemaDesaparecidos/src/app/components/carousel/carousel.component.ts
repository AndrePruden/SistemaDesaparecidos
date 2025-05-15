import { Component } from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent {
  images: string[] = [
    'images/familia-preocupada.jpg',
    'images/notificacion-celular.jpg',
    'images/mapa-avistamientos.jpg',
  ];

  titles: string[] = [
    '¿Tu ser querido ha desaparecido?',
    'Recibe alertas en tiempo real',
    'Visualiza y comparte avistamientos cercanos',
  ];

  descriptions: string[] = [
    'Creamos una red entre familias, comunidad y autoridades para responder rápidamente.',
    'Nuestro sistema envía notificaciones inmediatas a quienes puedan ayudar.',
    'Consulta reportes en el mapa y ayuda difundiendo información confiable.',
  ];

  currentImage: number = 0;

  nextImage() {
    this.currentImage = (this.currentImage + 1) % this.images.length;
  }

  prevImage() {
    this.currentImage =
      (this.currentImage - 1 + this.images.length) % this.images.length;
  }

  irASeccion() {
    const seccion = document.getElementById('Reportes_Relevantes');
    if (seccion) {
      seccion.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
