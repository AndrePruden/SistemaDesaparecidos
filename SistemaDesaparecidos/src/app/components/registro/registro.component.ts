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

  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  onSubmit(): void {
    if (!this.emailRegex.test(this.usuario.email)) {
      this.mensajeError = 'Por favor, ingresa un correo electrónico válido.';
      return;
    }

    const contraseña = this.usuario.password;
    
    if (contraseña.length < 8) {
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (!/[A-Z]/.test(contraseña)) {
      this.mensajeError = 'La contraseña debe contener al menos una letra mayúscula.';
      return;
    }

    if (!/[0-9]/.test(contraseña)) {
      this.mensajeError = 'La contraseña debe contener al menos un número.';
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(contraseña)) {
      this.mensajeError = 'La contraseña debe contener al menos un carácter especial.';
      return;
    }

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

  validarEmail(email: string): void {
    if (!this.emailRegex.test(email)) {
      this.mensajeError = 'Por favor, ingresa un correo electrónico válido.';
    } else {
      this.mensajeError = '';
    }
  }
   
}
