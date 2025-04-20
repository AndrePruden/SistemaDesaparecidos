<<<<<<< Updated upstream
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
=======
import { ReportesService } from '../../services/reportes.service';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cards-reportes',
  templateUrl: './cards-reportes.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./cards-reportes.component.scss']
})
export class CardsReportesComponent implements OnInit {
  reportes: any[] = [];

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.obtenerReportes();
  }

  obtenerReportes(): void {
    this.reportesService.obtenerReportes().subscribe(
      (data) => {
        this.reportes = data;
      },
      (error) => {
        console.error('Error al obtener reportes:', error);
      }
    );
  }
>>>>>>> Stashed changes
}
