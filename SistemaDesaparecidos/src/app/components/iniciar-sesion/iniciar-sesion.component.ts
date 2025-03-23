import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.scss']
})
export class IniciarSesionComponent {
  credenciales = { email: '', password: '' };
  mensaje: string = '';

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  onSubmit(): void {
    console.log('Credenciales:', this.credenciales);  // Verifica los valores que se están enviando
    this.usuarioService.iniciarSesion(this.credenciales).subscribe(
      (response) => { 
        console.log('Respuesta del backend:', response);  // Muestra la respuesta
        if (response.message === 'Inicio de sesión exitoso.') {
          localStorage.setItem('email', this.credenciales.email);
          this.router.navigate(['/']); // Redirigir a la página principal después del inicio de sesión
        } else {
          this.mensaje = 'Credenciales incorrectas. Inténtalo de nuevo.';
        }
      },
      (error) => {
        console.log('Error al iniciar sesión:', error);
        if (error.status === 404) {
          this.mensaje = 'El correo electrónico no está registrado.';
        } else if (error.status === 401) {
          this.mensaje = 'Contraseña incorrecta.';
        } else {
          this.mensaje = 'Error al iniciar sesión. Inténtalo de nuevo.';
        }
      }
    );
  }  
}
