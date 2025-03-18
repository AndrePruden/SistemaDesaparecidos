import { Component } from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent {
  images: string[] = [
    'https://previews.123rf.com/images/ayo88/ayo881503/ayo88150300042/37278205-tel%C3%A9fono-m%C3%B3vil-con-gps-imposici%C3%B3n-mapa-de-fondo.jpg',
    'https://media.licdn.com/dms/image/D5612AQHWpE1kA7kg1Q/article-cover_image-shrink_720_1280/0/1711516990539?e=2147483647&v=beta&t=WoACxvfXHIRz53PoNUEgIaJKCBNJxSUO2QnitUFNNqA',
    'https://www.opinion.com.bo/media/opinion/images/2022/12/09/2022120922534446978.jpg',
  ];
  
  currentImage: number = 0;

  nextImage() {
    this.currentImage = (this.currentImage + 1) % this.images.length;
  }

  prevImage() {
    this.currentImage = (this.currentImage - 1 + this.images.length) % this.images.length;
  }
}
