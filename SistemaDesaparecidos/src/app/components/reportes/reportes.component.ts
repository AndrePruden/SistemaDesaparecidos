import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
<<<<<<< Updated upstream
import { UsuarioService } from '../../services/usuario.service';
=======
>>>>>>> Stashed changes
import { FeatureToggleService } from '../../services/feature-toggle.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
<<<<<<< Updated upstream
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
=======
import { Router } from '@angular/router';
>>>>>>> Stashed changes
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CardsReportesComponent } from '../cards-reportes/cards-reportes.component';
import { FormAvistamientosComponent } from '../form-avistamientos/form-avistamientos.component';
import { ForoAvistamientosComponent } from '../foro-avistamientos/foro-avistamientos.component';
<<<<<<< Updated upstream
=======
import { FormReportesComponent } from '../form-reportes/form-reportes.component';
>>>>>>> Stashed changes

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
<<<<<<< Updated upstream
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
=======
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
>>>>>>> Stashed changes
    HeaderComponent,
    FooterComponent,
    CardsReportesComponent,
    FormAvistamientosComponent,
<<<<<<< Updated upstream
    ForoAvistamientosComponent
=======
    ForoAvistamientosComponent,
    FormReportesComponent
>>>>>>> Stashed changes
  ],
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  emailUsuario: string | null = null;
  estaLogueado: boolean = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private featureToggleService: FeatureToggleService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.verificarSesion();
<<<<<<< Updated upstream
      if (this.featureToggleService.isFeatureEnabled('reportes')) {
        this.obtenerReportes();
      }
=======
>>>>>>> Stashed changes
    }
  }

  verificarSesion(): void {
    this.emailUsuario = localStorage.getItem('email');
    this.estaLogueado = !!this.emailUsuario;
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('email');
      this.estaLogueado = false;
      this.emailUsuario = null;
      this.router.navigate(['/']);
    }
  }
}
