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
  mostrarPassword = false; 

 
  constructor(private usuarioService: UsuarioService, private router: Router) {
      console.log('[IniciarSesionComponent] Componente construido.');
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit(): void {
      console.log('[IniciarSesionComponent] 📩 Botón Submit clickeado.');
    if (!this.credenciales.email || !this.credenciales.password) {
      this.mensaje = 'Por favor, completa todos los campos.';
       console.warn('[IniciarSesionComponent] Validación básica fallida: Campos vacíos.');
      return;
    }
    console.log('[IniciarSesionComponent] 🔐 Intentando iniciar sesión con:', this.credenciales.email);

    this.usuarioService.iniciarSesion(this.credenciales).subscribe(
      (response) => {
        console.log('[IniciarSesionComponent] ✅ Respuesta del backend:', response);
       
        if (response.message === 'Inicio de sesión exitoso.') {
          console.log('🎉 [IniciarSesionComponent] Inicio de sesión exitoso para el email:', this.credenciales.email);
         
          this.usuarioService.setCurrentUserEmail(this.credenciales.email);
          
          this.mensaje = 'Inicio de sesión exitoso!'; 
          this.router.navigate(['/']); 
        }  else {
          console.warn('❌ [IniciarSesionComponent] Error de inicio de sesión: Mensaje no esperado del backend.');
          this.mensaje = response.message || 'Credenciales incorrectas. Inténtalo de nuevo.'; // Usar el mensaje del backend si existe
        }
      },
      (error) => {
        console.error('❌ [IniciarSesionComponent] Error al iniciar sesión:', error);
         
        if (error.status === 404) {
          this.mensaje = 'El correo electrónico no está registrado.';
          console.warn('⚠️ [IniciarSesionComponent] El correo electrónico no está registrado:', this.credenciales.email);
        } else if (error.status === 401) {
          this.mensaje = 'Contraseña incorrecta.';
          console.warn('⚠️ [IniciarSesionComponent] Contraseña incorrecta para el correo:', this.credenciales.email);
        } else if (error.error?.message) { 
             this.mensaje = error.error.message;
        }
        else {
          this.mensaje = 'Error al iniciar sesión. Inténtalo de nuevo.';
          console.error('⚠️ [IniciarSesionComponent] Error inesperado:', error);
        }
      }
    );
  }
  
}