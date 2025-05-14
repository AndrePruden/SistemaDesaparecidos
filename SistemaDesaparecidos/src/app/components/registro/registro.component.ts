import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule,HeaderComponent,FooterComponent], 
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent {
  usuario = {
    nombre: '',
    ci: '',
    fechaNacimiento: '',
    celular: '',
    direccion: '',
    email: '',
    password: '',
    notificaciones: false
  };  

  mensaje: string = '';
  mensajeError: string = '';
  mostrarPassword: boolean = false; 

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  constructor(private usuarioService: UsuarioService) {}

  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  onSubmit(): void {
    console.log('🔑 Datos ingresados:', this.usuario);

    if (!this.usuario.nombre || this.usuario.nombre.length < 3 || !/^[a-zA-Z\s]+$/.test(this.usuario.nombre)) {
      this.mensajeError = 'El nombre debe tener al menos 3 caracteres y solo contener letras.';
      return;
    }

    if (!this.usuario.ci || isNaN(Number(this.usuario.ci))) {
      this.mensajeError = 'El CI debe ser un número válido.';
      return;
    }

    if (!this.usuario.fechaNacimiento) {
      this.mensajeError = 'La fecha de nacimiento es obligatoria.';
      return;
    }

    const fechaNacimiento = new Date(this.usuario.fechaNacimiento);
    const edad = this.calcularEdad(fechaNacimiento);
    if (edad < 18) {
      this.mensajeError = 'Debes tener al menos 18 años para crear una cuenta.';
      return;
    }

    if (!this.usuario.celular || !/^\d{8}$/.test(this.usuario.celular)) {
      this.mensajeError = 'El número de celular debe tener 8 dígitos.';
      return;
    }

    if (!this.usuario.direccion || this.usuario.direccion.length < 5) {
      this.mensajeError = 'La dirección debe tener al menos 5 caracteres.';
      return;
    }

    if (!this.emailRegex.test(this.usuario.email)) {
      this.mensajeError = 'Por favor, ingresa un correo electrónico válido.';
      return;
    }

    const contraseña = this.usuario.password;
    
    if (contraseña.length < 8) {
      console.warn('⚠️ La contraseña ingresada es demasiado corta:', contraseña);
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (contraseña.length < 8 || !/[A-Z]/.test(contraseña) || !/[0-9]/.test(contraseña) || !/[!@#$%^&*(),.?":{}|<>]/.test(contraseña)) {
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.';
      return;
    }

    const usuarioFormateado = {
      nombre: this.usuario.nombre.trim(),
      ci: Number(this.usuario.ci),
      fechaNacimiento: this.usuario.fechaNacimiento, // formato yyyy-MM-dd
      celular: Number(this.usuario.celular),
      direccion: this.usuario.direccion.trim(),
      email: this.usuario.email.trim(),
      password: this.usuario.password,
      notificaciones: this.usuario.notificaciones
    };

    console.log('✅ Enviando usuario al backend:', usuarioFormateado);

    this.usuarioService.registrarUsuario(this.usuario).subscribe(
      (response) => {
        this.mensaje = "Registro exitoso";  
        this.mensajeError = ''; 
        console.log('🎉 Registro exitoso:', response);
      },
      (error) => {
        console.error('❌ Error al registrar usuario:', error);
        if (error.status === 400) {
          this.mensajeError = 'El correo ya está registrado.';
        } else {
          this.mensajeError = 'Error inesperado. Intenta más tarde.';
        }
        this.mensaje = '';
      }
    );
  }

  validarEmail(email: string): void {
    console.log('🔍 Validando correo electrónico:', email);
    if (!this.emailRegex.test(email)) {
      this.mensajeError = 'Por favor, ingresa un correo electrónico válido.';
    } else {
      this.mensajeError = '';
    }
  }

  calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth();
    if (mes < fechaNacimiento.getMonth() || (mes === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }
}