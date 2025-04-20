import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent {
  usuario = { nombre: '', email: '', password: '' };
  mensaje: string = '';
  mensajeError: string = '';

  constructor(private usuarioService: UsuarioService) {}

  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  onSubmit(): void {
    console.log('🔑 Intentando registrar el usuario con los siguientes datos:', this.usuario);
    if (!this.emailRegex.test(this.usuario.email)) {
      console.warn('⚠️ El correo electrónico ingresado no es válido:', this.usuario.email);
      this.mensajeError = 'Por favor, ingresa un correo electrónico válido.';
      return;
    }

    const contraseña = this.usuario.password;
    
    if (contraseña.length < 8) {
      console.warn('⚠️ La contraseña ingresada es demasiado corta:', contraseña);
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (!/[A-Z]/.test(contraseña)) {
      console.warn('⚠️ La contraseña no contiene una letra mayúscula:', contraseña);
      this.mensajeError = 'La contraseña debe contener al menos una letra mayúscula.';
      return;
    }

    if (!/[0-9]/.test(contraseña)) {
      console.warn('⚠️ La contraseña no contiene un número:', contraseña);
      this.mensajeError = 'La contraseña debe contener al menos un número.';
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(contraseña)) {
      console.warn('⚠️ La contraseña no contiene un carácter especial:', contraseña);
      this.mensajeError = 'La contraseña debe contener al menos un carácter especial.';
      return;
    }

    console.log('✅ Datos validados, intentando registrar al usuario en el backend...');
    this.usuarioService.registrarUsuario(this.usuario).subscribe(
      (response) => {
        console.log('🎉 Registro exitoso:', response);
        this.mensaje = response.message;  
        this.mensajeError = ''; 
        this.usuario = { nombre: '', email: '', password: '' }; 
      },
      (error) => {
        console.error('❌ Error al registrar usuario:', error);
        if (error.status === 400) {
          this.mensajeError = 'El correo electrónico ya está registrado. Por favor, prueba con otro.';
        } else if (error.status === 500) {
          this.mensajeError = 'Hubo un error al intentar registrar el usuario. Por favor, intenta más tarde.';
        } else {
          this.mensajeError = 'Ocurrió un error desconocido. Por favor, intenta nuevamente.';
        }
        this.mensaje = ''; 
      }
    );
  }

  validarEmail(email: string): void {
    console.log('🔍 Validando correo electrónico:', email);
    if (!this.emailRegex.test(email)) {
      console.warn('⚠️ Correo electrónico no válido:', email);
      this.mensajeError = 'Por favor, ingresa un correo electrónico válido.';
    } else {
      this.mensajeError = '';
    }
  }
}
