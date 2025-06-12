import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface CoordenadaReporte {
  idDesaparecido: number;
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  // private baseUrl = 'https://sistemadesaparecidos-production.up.railway.app/reportes/todos'; // Usar esta en producción
  private baseUrl = 'http://localhost:8080/reportes/todos'; // Usar esta en desarrollo

  constructor(private http: HttpClient) {}

  obtenerCoordenadas(): Observable<CoordenadaReporte[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map((data: any[]) => {
        return data
          .map(reporte => {
            if (reporte.lugarDesaparicion) {
              const partes = reporte.lugarDesaparicion.split(',');
              const lat = parseFloat(partes[0]);
              const lng = parseFloat(partes[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                return {
                  idDesaparecido: reporte.idDesaparecido,
                  lat,
                  lng
                } as CoordenadaReporte;
              }
            }
            return null;
          })
          .filter(coord => coord !== null) as CoordenadaReporte[];
      })
    );
  }
}
