import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = 'http://localhost:8080/usuarios'; // URL de nuestro backend

  constructor(private http: HttpClient) {}

  // Método para registrar un usuario
  registrarUsuario(usuario: Usuario): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/registro`, usuario);
  }

  // Método para iniciar sesión
  iniciarSesion(credenciales: { email: string, password: string }): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/iniciar-sesion`, credenciales);
  }
}