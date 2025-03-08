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
  private apiUrl = 'http://localhost:8080/usuarios'; //es el URL de nuestro backend chicos

  constructor(private http: HttpClient) {}

  registrarUsuario(usuario: Usuario): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/registro`, usuario);
  }
}