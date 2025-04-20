import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private baseUrl = 'http://localhost:8080/reportes';

  constructor(private http: HttpClient) {}

  obtenerReportes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/todos`);
  }

  crearReporte(reporte: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear`, reporte);
  }
}
