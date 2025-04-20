import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Avistamiento {
  idAvistamiento: number;
  fecha: string;
  lugar: string;
  descripcion: string;
  personaDesaparecida: any;
  emailUsuario: string;
}

@Injectable({
  providedIn: 'root'
})
export class AvistamientoService {
  private apiUrl = 'http://localhost:8080/avistamientos';

  constructor(private http: HttpClient) {}

  // Ya existentes
  obtenerTodos(): Observable<Avistamiento[]> {
    return this.http.get<Avistamiento[]>(`${this.apiUrl}/todos`);
  }

  crear(avistamiento: Avistamiento): Observable<Avistamiento> {
    return this.http.post<Avistamiento>(`${this.apiUrl}/crear`, avistamiento);
  }

  obtenerPorUsuario(email: string): Observable<Avistamiento[]> {
    return this.http.get<Avistamiento[]>(`${this.apiUrl}/usuario/${email}`);
  }

  obtenerPorReporte(idReporte: number): Observable<Avistamiento[]> {
    return this.http.get<Avistamiento[]>(`${this.apiUrl}/reporte/${idReporte}`);
  }

  obtenerUltimoAvistamiento(idReporte: number): Observable<Avistamiento> {
    return this.http.get<Avistamiento>(`${this.apiUrl}/ultimo/${idReporte}`);
  }
}
