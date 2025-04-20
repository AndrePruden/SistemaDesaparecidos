import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarouselComponent } from '../carousel/carousel.component';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CardsReportesComponent } from '../cards-reportes/cards-reportes.component';
import { ForoAvistamientosComponent } from '../foro-avistamientos/foro-avistamientos.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    CarouselComponent, 
    HeaderComponent,
    FooterComponent,
    CardsReportesComponent,
    ForoAvistamientosComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {
    
  }
}