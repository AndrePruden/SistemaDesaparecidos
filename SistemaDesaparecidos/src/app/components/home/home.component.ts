import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarouselComponent } from '../carousel/carousel.component';
import { HeaderComponent } from '../header/header.component';
import { ReportesComponent } from '../reportes/reportes.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CarouselComponent, HeaderComponent, ReportesComponent], // Importa RouterModule
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {
    
  }
}