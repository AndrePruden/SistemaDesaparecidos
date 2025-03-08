import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
})
export class RegistroComponent {
  usuario = { nombre: '', email: '', password: '' };
  mensaje: string = '';

  constructor(private usuarioService: UsuarioService) {}

  onSubmit(): void {
    this.usuarioService.registrarUsuario(this.usuario).subscribe(
      (response) => {
        this.mensaje = response;
        this.usuario = { nombre: '', email: '', password: '' };
      },
      () => {
        this.mensaje = 'Error al registrar el usuario. Inténtalo de nuevo.';
      }
    );
  }
}
