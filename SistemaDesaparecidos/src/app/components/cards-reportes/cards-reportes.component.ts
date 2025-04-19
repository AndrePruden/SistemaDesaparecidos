import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-cards-reportes',
  imports: [CommonModule],
  templateUrl: './cards-reportes.component.html',
  styleUrl: './cards-reportes.component.scss'
})
export class CardsReportesComponent {
  reportes: any[] = [];  
}
