import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// --- Importar UsuarioService ---
import { UsuarioService } from '../../services/usuario.service';
// ------------------------------
import { HeaderComponent } from '../header/header.component'; // Asumo que son correctas las rutas
import { FooterComponent } from '../footer/footer.component'; // Asumo que son correctas las rutas
import { Router } from '@angular/router';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true, // Mantener si es standalone
  imports: [CommonModule, FormsModule,HeaderComponent,FooterComponent], // Asegurar imports
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.scss']
})
export class IniciarSesionComponent {
  credenciales = { email: '', password: '' };
  mensaje: string = '';
  mostrarPassword = false; // Booleano directamente, no un getter/setter si solo controlas visibilidad del input

  // Asegúrate que el constructor inyecta UsuarioService y Router
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
        // --- Verificar la respuesta del backend para el éxito ---
        if (response.message === 'Inicio de sesión exitoso.') {
          console.log('🎉 [IniciarSesionComponent] Inicio de sesión exitoso para el email:', this.credenciales.email);
          // --- LA LÍNEA CLAVE: Notificar al servicio que el usuario ha iniciado sesión ---
          this.usuarioService.setCurrentUserEmail(this.credenciales.email);
          // Esto también guarda el email en localStorage dentro del servicio
          // --------------------------------------------------------------------------
          this.mensaje = 'Inicio de sesión exitoso!'; // Mensaje de éxito opcional en el form de login
          this.router.navigate(['/']); // Redirigir a la página principal o a donde necesites
        }  else {
          console.warn('❌ [IniciarSesionComponent] Error de inicio de sesión: Mensaje no esperado del backend.');
          this.mensaje = response.message || 'Credenciales incorrectas. Inténtalo de nuevo.'; // Usar el mensaje del backend si existe
        }
      },
      (error) => {
        console.error('❌ [IniciarSesionComponent] Error al iniciar sesión:', error);
         // Mostrar un mensaje más amigable basado en el estado o mensaje del error HTTP
        if (error.status === 404) {
          this.mensaje = 'El correo electrónico no está registrado.';
          console.warn('⚠️ [IniciarSesionComponent] El correo electrónico no está registrado:', this.credenciales.email);
        } else if (error.status === 401) {
          this.mensaje = 'Contraseña incorrecta.';
          console.warn('⚠️ [IniciarSesionComponent] Contraseña incorrecta para el correo:', this.credenciales.email);
        } else if (error.error?.message) { // Si el backend envió un mensaje de error en el cuerpo
             this.mensaje = error.error.message;
        }
        else {
          this.mensaje = 'Error al iniciar sesión. Inténtalo de nuevo.';
          console.error('⚠️ [IniciarSesionComponent] Error inesperado:', error);
        }
      }
    );
  }
  // No necesitas un método `crearAvistamiento` aquí, ese pertenece al `FormAvistamientosComponent`
  // y tu `onSubmit` ya lo maneja indirectamente llamando al servicio correcto.
}