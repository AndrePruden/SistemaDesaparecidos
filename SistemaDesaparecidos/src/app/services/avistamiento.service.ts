import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvistamientoService {
  private baseUrl = 'http://localhost:8080/avistamientos';

  constructor(private http: HttpClient) {}

  crearAvistamiento(avistamiento: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear`, avistamiento);
  }

  obtenerAvistamientosPorUsuario(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usuario/${email}`);
  }

  obtenerAvistamientosPorReporte(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reporte/${id}`);
  }

  obtenerUltimoAvistamiento(idReporte: number): Observable<any> {
    return this.http.get<any[]>(`${this.baseUrl}/ultimo/${idReporte}`);
  }
}