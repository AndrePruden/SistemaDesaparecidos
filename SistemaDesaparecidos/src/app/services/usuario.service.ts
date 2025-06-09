import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject,Observable } from 'rxjs';

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
  //private apiUrl = 'https://sistemadesaparecidos-production.up.railway.app/usuarios';
  private apiUrl = 'http://localhost:8080/usuarios';

  // --- Modificación: Inicializar el BehaviorSubject con el email de localStorage si existe ---
  private currentUserEmailSubject = new BehaviorSubject<string | null>(this.getInitialUserEmail());
  public currentUserEmail$: Observable<string | null> = this.currentUserEmailSubject.asObservable();
  // -------------------------------------------------------------------------------------------


  constructor(private http: HttpClient) {
     console.log('[UsuarioService] Servicio inicializado.');
     console.log('[UsuarioService] Email inicial (de localStorage):', this.currentUserEmailSubject.getValue());
  }

  // --- Nuevo método para obtener el email inicial de localStorage ---
  private getInitialUserEmail(): string | null {
      if (typeof localStorage !== 'undefined') { // Asegurar que localStorage está disponible (en navegador)
           const email = localStorage.getItem('email');
           console.log('[UsuarioService] Leyendo "email" de localStorage:', email);
           return email;
      }
      console.warn('[UsuarioService] localStorage no disponible.');
      return null;
  }
  // ------------------------------------------------------------------


  // Getter público para obtener el email actual del usuario (síncrono)
  public getCurrentUserEmail(): string | null {
    // Este método obtiene el valor actual del BehaviorSubject, que ahora se inicializa desde localStorage
    return this.currentUserEmailSubject.getValue();
  }

  // --- Método para establecer el email del usuario logueado ---
  // Este método será llamado desde el componente de login/logout
  public setCurrentUserEmail(email: string | null): void {
      if (typeof localStorage !== 'undefined') { // Asegurar que localStorage está disponible
           if (email) {
               localStorage.setItem('email', email); // Guardar también en localStorage
               console.log('[UsuarioService] Email guardado en localStorage:', email);
           } else {
               localStorage.removeItem('email'); // Remover de localStorage al cerrar sesión
               console.log('[UsuarioService] Email removido de localStorage.');
           }
      } else {
           console.warn('[UsuarioService] localStorage no disponible, no se pudo guardar/remover email.');
      }
      this.currentUserEmailSubject.next(email); // Emitir el nuevo valor a los suscriptores
      console.log('[UsuarioService] BehaviorSubject actualizado con email:', email);
  }
  // -------------------------------------------------------------


  registrarUsuario(usuario: Usuario): Observable<ResponseMessage> {
     console.log('[UsuarioService] Enviando POST /registro');
    return this.http.post<ResponseMessage>(`${this.apiUrl}/registro`, usuario);
  }

  iniciarSesion(credenciales: { email: string, password: string }): Observable<ResponseMessage> {
    console.log('[UsuarioService] Enviando POST /iniciar-sesion');
    return this.http.post<ResponseMessage>(`${this.apiUrl}/iniciar-sesion`, credenciales);
  }

  obtenerUsuarioPorEmail(email: string): Observable<any> { // Especificar tipo de retorno
     console.log(`[UsuarioService] Solicitando GET /email/${email}`);
    return this.http.get<any>(`${this.apiUrl}/email/${email}`);
  }

  actualizarUsuario(usuario: any): Observable<any> { // Especificar tipo de retorno
    const id = usuario.id;
     console.log(`[UsuarioService] Enviando PUT /${id} (actualizar usuario)`);
    return this.http.put<any>(`${this.apiUrl}/${id}`, usuario);
  }

  // --- Añadir método para cerrar sesión ---
  cerrarSesion(): void {
      console.log('[UsuarioService] Cerrando sesión.');
      this.setCurrentUserEmail(null); // Establecer el email a null (esto también limpia localStorage)
  }
  // --------------------------------------
}