import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule,HeaderComponent,FooterComponent],
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.scss']
})
export class IniciarSesionComponent {
  credenciales = { email: '', password: '' };
  mensaje: string = '';
  mostrarPassword: boolean = false; 

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  onSubmit(): void {
    if (!this.credenciales.email || !this.credenciales.password) {
      this.mensaje = 'Por favor, completa todos los campos.';
      return;
    }
    console.log('🔐 Intentando iniciar sesión con:', this.credenciales);  
    this.usuarioService.iniciarSesion(this.credenciales).subscribe(
      (response) => { 
        console.log('Respuesta del backend:', response);  
        if (response.message === 'Inicio de sesión exitoso.') {
          console.log('🎉 Inicio de sesión exitoso para el email:', this.credenciales.email);
          localStorage.setItem('email', this.credenciales.email);
          this.router.navigate(['/']); 
        }  else {
          console.warn('❌ Error de inicio de sesión: Credenciales incorrectas.');
          this.mensaje = 'Credenciales incorrectas. Inténtalo de nuevo.';
        }
      },
      (error) => {
        console.log('Error al iniciar sesión:', error);
        if (error.status === 404) {
          this.mensaje = 'El correo electrónico no está registrado.';
          console.warn('⚠️ El correo electrónico no está registrado:', this.credenciales.email);
        } else if (error.status === 401) {
          this.mensaje = 'Contraseña incorrecta.';
          console.warn('⚠️ Contraseña incorrecta para el correo:', this.credenciales.email);
        } else {
          this.mensaje = 'Error al iniciar sesión. Inténtalo de nuevo.';
          console.error('⚠️ Error inesperado:', error);
        }
      }
    );
  }  
}

