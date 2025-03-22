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
  mensajeError: string = '';

  constructor(private usuarioService: UsuarioService) {}

  onSubmit(): void {
    this.usuarioService.registrarUsuario(this.usuario).subscribe(
      (response) => {
        this.mensaje = response.message;  // Acceder a la propiedad 'message' del objeto de respuesta
        this.mensajeError = ''; // Limpiar cualquier mensaje de error previo
        this.usuario = { nombre: '', email: '', password: '' }; // Limpiar formulario
      },
      (error) => {
        if (error.status === 400) {
          this.mensajeError = 'El correo electrónico ya está registrado. Por favor, prueba con otro.';
        } else if (error.status === 500) {
          this.mensajeError = 'Hubo un error al intentar registrar el usuario. Por favor, intenta más tarde.';
        } else {
          this.mensajeError = 'Ocurrió un error desconocido. Por favor, intenta nuevamente.';
        }
        this.mensaje = '';  // Limpiar mensaje de éxito en caso de error
      }
    );
  }
   
}
