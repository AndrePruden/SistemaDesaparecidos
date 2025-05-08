import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  usuario: any = null;
  mensajeError: string = '';

  constructor(private storageService: StorageService,
    private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    const email = this.storageService.getItem('email');
    if (!email) {
      this.mensajeError = 'No se encontró sesión activa.';
      return;
    }

    this.usuarioService.obtenerUsuarioPorEmail(email).subscribe(
      (data: any) => {
        this.usuario = data;
      },
      (error: any) => {
        console.error('Error al obtener los datos del usuario:', error);
        this.mensajeError = 'No se pudieron cargar los datos del usuario.';
      }
    );
  }
}
