import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { Router } from '@angular/router';

interface ErroresValidacion {
  nombre?: string;
  ci?: string;
  fechaNacimiento?: string;
  celular?: string;
  direccion?: string;
  email?: string;
  password?: string;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent], 
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

  errores: ErroresValidacion = {};
  mensaje: string = '';
  mostrarPassword: boolean = false;
  private readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly nombreRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/; // Incluye caracteres especiales del español
  private readonly passwordRegex = {
    mayuscula: /[A-Z]/,
    minuscula: /[a-z]/,
    numero: /[0-9]/,
    especial: /[!@#$%^&*(),.?":{}|<>]/
  };

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  validarNombre(): void {
    const nombre = this.usuario.nombre.trim();
    if (!nombre) {
      this.errores.nombre = 'El nombre es obligatorio.';
      return;
    }
    if (nombre.length < 2) {
      this.errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
      return;
    }
    if (nombre.length > 50) {
      this.errores.nombre = 'El nombre no puede exceder los 50 caracteres.';
      return;
    }
    if (!this.nombreRegex.test(nombre)) {
      this.errores.nombre = 'El nombre solo puede contener letras y espacios.';
      return;
    }
    if (nombre.replace(/\s/g, '').length === 0) {
      this.errores.nombre = 'El nombre no puede contener solo espacios.';
      return;
    }
    if (/\s{2,}/.test(nombre)) {
      this.errores.nombre = 'El nombre no puede tener espacios múltiples consecutivos.';
      return;
    }
    delete this.errores.nombre;
  }

  validarCI(): void {
    const ci = this.usuario.ci.trim();
    if (!ci) {
      this.errores.ci = 'El Carnet de Identidad es obligatorio.';
      return;
    }
    if (!/^\d+$/.test(ci)) {
      this.errores.ci = 'El CI debe contener solo números.';
      return;
    }
    if (ci.length < 6 || ci.length > 10) {
      this.errores.ci = 'El CI debe tener entre 6 y 10 dígitos.';
      return;
    }
    if (/^(.)\1*$/.test(ci)) {
      this.errores.ci = 'El CI no puede ser un número repetido (ej: 1111111).';
      return;
    }
    delete this.errores.ci;
  }

  validarFechaNacimiento(): void {
    if (!this.usuario.fechaNacimiento) {
      this.errores.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';
      return;
    }
    const fechaNacimiento = new Date(this.usuario.fechaNacimiento);
    const fechaActual = new Date();
    if (isNaN(fechaNacimiento.getTime())) {
      this.errores.fechaNacimiento = 'La fecha de nacimiento no es válida.';
      return;
    }
    if (fechaNacimiento > fechaActual) {
      this.errores.fechaNacimiento = 'La fecha de nacimiento no puede ser en el futuro.';
      return;
    }
    const edad = this.calcularEdad(fechaNacimiento);
    if (edad < 18) {
      this.errores.fechaNacimiento = `Debes tener al menos 18 años para registrarte. Tu edad actual es ${edad} años.`;
      return;
    }
    if (edad > 120) {
      this.errores.fechaNacimiento = 'La fecha de nacimiento no parece ser válida (edad superior a 120 años).';
      return;
    }
    delete this.errores.fechaNacimiento;
  }

  validarCelular(): void {
    const celular = this.usuario.celular.trim();
    if (!celular) {
      this.errores.celular = 'El número de celular es obligatorio.';
      return;
    }
    if (!/^\d+$/.test(celular)) {
      this.errores.celular = 'El número de celular debe contener solo dígitos.';
      return;
    }
    if (celular.length !== 8) {
      this.errores.celular = 'El número de celular debe tener exactamente 8 dígitos.';
      return;
    }
    if (!/^[67]/.test(celular)) {
      this.errores.celular = 'El número de celular debe comenzar con 6 o 7.';
      return;
    }
    if (/^(.)\1*$/.test(celular)) {
      this.errores.celular = 'El número de celular no puede ser un número repetido.';
      return;
    }
    delete this.errores.celular;
  }

  validarDireccion(): void {
    const direccion = this.usuario.direccion.trim();
    if (!direccion) {
      this.errores.direccion = 'La dirección es obligatoria.';
      return;
    }
    if (direccion.length < 10) {
      this.errores.direccion = 'La dirección debe tener al menos 10 caracteres para ser específica.';
      return;
    }
    if (direccion.length > 200) {
      this.errores.direccion = 'La dirección no puede exceder los 200 caracteres.';
      return;
    }
    if (!/[a-zA-Z0-9]/.test(direccion)) {
      this.errores.direccion = 'La dirección debe contener al menos algunas letras o números.';
      return;
    }
    delete this.errores.direccion;
  }

  validarEmail(): void {
    const email = this.usuario.email.trim().toLowerCase();
    if (!email) {
      this.errores.email = 'El correo electrónico es obligatorio.';
      return;
    }
    if (email.length > 254) {
      this.errores.email = 'El correo electrónico es demasiado largo.';
      return;
    }
    if (!this.emailRegex.test(email)) {
      this.errores.email = 'Por favor, ingresa un correo electrónico válido (ej: usuario@ejemplo.com).';
      return;
    }
    if (/\.\./.test(email)) {
      this.errores.email = 'El correo electrónico no puede tener puntos consecutivos.';
      return;
    }
    if (email.startsWith('.') || email.endsWith('.')) {
      this.errores.email = 'El correo electrónico no puede comenzar o terminar con un punto.';
      return;
    }
    delete this.errores.email;
  }

  validarPassword(): void {
    const password = this.usuario.password;
    if (!password) {
      this.errores.password = 'La contraseña es obligatoria.';
      return;
    }
    const erroresPassword: string[] = [];
    if (password.length < 8) {
      erroresPassword.push('al menos 8 caracteres');
    }
    if (password.length > 128) {
      this.errores.password = 'La contraseña no puede exceder los 128 caracteres.';
      return;
    }
    if (!this.passwordRegex.mayuscula.test(password)) {
      erroresPassword.push('al menos una letra mayúscula');
    }
    if (!this.passwordRegex.minuscula.test(password)) {
      erroresPassword.push('al menos una letra minúscula');
    }
    if (!this.passwordRegex.numero.test(password)) {
      erroresPassword.push('al menos un número');
    }
    if (!this.passwordRegex.especial.test(password)) {
      erroresPassword.push('al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
    }
    if (/\s/.test(password)) {
      erroresPassword.push('no debe contener espacios');
    }
    const contraseñasComunes = [
      'password', '12345678', 'qwerty123', 'abc123456', 
      'password123', '123456789', 'admin123'
    ];
    if (contraseñasComunes.some(común => password.toLowerCase().includes(común))) {
      erroresPassword.push('No debe ser una contraseña común');
    } 
    if (erroresPassword.length > 0) {
      this.errores.password = `La contraseña debe tener: ${erroresPassword.join(', ')}.`;
      return;
    }
    delete this.errores.password;
  }

  onNombreChange(): void {
    this.validarNombre();
  }

  onCIChange(): void {
    this.validarCI();
  }

  onFechaNacimientoChange(): void {
    this.validarFechaNacimiento();
  }

  onCelularChange(): void {
    this.validarCelular();
  }

  onDireccionChange(): void {
    this.validarDireccion();
  }

  onEmailChange(): void {
    this.validarEmail();
  }

  onPasswordChange(): void {
    this.validarPassword();
  }

  validarFormulario(): boolean {
    this.validarNombre();
    this.validarCI();
    this.validarFechaNacimiento();
    this.validarCelular();
    this.validarDireccion();
    this.validarEmail();
    this.validarPassword();
    
    return Object.keys(this.errores).length === 0;
  }

  onSubmit(): void {
    console.log('Datos ingresados:', this.usuario);
    this.mensaje = '';
    if (!this.validarFormulario()) {
      this.mensaje = 'Por favor, corrige los errores en el formulario antes de continuar.';
      return;
    }
    const usuarioFormateado = {
      nombre: this.usuario.nombre.trim(),
      ci: Number(this.usuario.ci),
      fechaNacimiento: this.usuario.fechaNacimiento,
      celular: Number(this.usuario.celular),
      direccion: this.usuario.direccion.trim(),
      email: this.usuario.email.trim().toLowerCase(),
      password: this.usuario.password,
      notificaciones: this.usuario.notificaciones
    };
    console.log('Enviando usuario al backend:', usuarioFormateado);
    this.usuarioService.registrarUsuario(usuarioFormateado).subscribe({
      next: (response) => {
        this.mensaje = "¡Registro exitoso! Bienvenido a nuestra plataforma.";
        console.log('Registro exitoso:', response);
        this.router.navigate(['/']); 
      },
      error: (error) => {
        console.error('Error al registrar usuario:', error);
        
        if (error.status === 400) {
          if (error.error?.message?.includes('email')) {
            this.errores.email = 'Este correo electrónico ya está registrado.';
          } else if (error.error?.message?.includes('ci')) {
            this.errores.ci = 'Este Carnet de Identidad ya está registrado.';
          } else {
            this.mensaje = 'Los datos ingresados ya están en uso. Verifica tu información.';
          }
        } else if (error.status === 422) {
          this.mensaje = 'Los datos enviados no son válidos. Verifica la información.';
        } else if (error.status === 500) {
          this.mensaje = 'Error interno del servidor. Intenta más tarde.';
        } else {
          this.mensaje = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        }
      }
    });
  }

  limpiarFormulario(): void {
    this.usuario = {
      nombre: '',
      ci: '',
      fechaNacimiento: '',
      celular: '',
      direccion: '',
      email: '',
      password: '',
      notificaciones: false
    };
    this.errores = {};
    this.mensaje = '';
  }

  calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth();
    
    if (mes < fechaNacimiento.getMonth() || 
        (mes === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  tieneErrores(): boolean {
    return Object.keys(this.errores).length > 0;
  }

  getPrimerError(): string {
    const primerError = Object.values(this.errores)[0];
    return primerError || '';
  }
}