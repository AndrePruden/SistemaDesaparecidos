import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password: string;
}

export interface ResponseMessage {
  message: string;
}

@Injectable({
  providedIn: 'root',
})

export class UsuarioService {
  private apiUrl = 'https://sistemadesaparecidos-production.up.railway.app/usuarios'; 
  //private apiUrl = 'http://localhost:8080/usuarios';

  constructor(private http: HttpClient) {}

  registrarUsuario(usuario: Usuario): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(`${this.apiUrl}/registro`, usuario);
  }

  iniciarSesion(credenciales: { email: string, password: string }): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(`${this.apiUrl}/iniciar-sesion`, credenciales);
  }

  obtenerUsuarioPorEmail(email: string) {
    return this.http.get<any>(`${this.apiUrl}/email/${email}`);
  }  

  actualizarUsuario(usuario: any): Observable<any> {
    const id = usuario.id; 
    return this.http.put<any>(`${this.apiUrl}/${id}`, usuario);
  }

}