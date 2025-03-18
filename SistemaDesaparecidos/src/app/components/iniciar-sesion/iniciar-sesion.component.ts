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
    this.usuarioService.iniciarSesion(this.credenciales).subscribe(
      (response) => {
        if (response) {
          this.router.navigate(['/']); // Redirigir a la página principal después del inicio de sesión
        } else {
          this.mensaje = 'Credenciales incorrectas. Inténtalo de nuevo.';
        }
      },
      () => {
        this.mensaje = 'Error al iniciar sesión. Inténtalo de nuevo.';
      }
    );
  }
}