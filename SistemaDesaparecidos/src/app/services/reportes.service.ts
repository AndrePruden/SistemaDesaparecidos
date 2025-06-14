import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private baseUrl = 'https://sistemadesaparecidos-production-6b5e.up.railway.app/reportes';
  //private baseUrl = 'http://localhost:8080/reportes';

  constructor(private http: HttpClient) {}

  obtenerReportes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/todos`);
  }

  crearReporte(reporte: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear`, reporte);
  }

  obtenerReportesFiltrados(nombre: string, edad: number, lugar: string, fecha: string) {
    const params = {
      nombre,
      edad: edad ? edad.toString() : '',
      lugar,
      fecha
    };
    return this.http.get<any[]>(`${this.baseUrl}/filtrar`, { params });
  }

  getAvistamientosPorReporte(id: number) {
    return this.http.get<any[]>(`${this.baseUrl}/reporte/${id}`);
  }

  archivarReporte(id: number) {
    return this.http.put(`${this.baseUrl}/${id}/archivar`, null,{
      responseType: 'text' as 'json'
    });
  }
}
