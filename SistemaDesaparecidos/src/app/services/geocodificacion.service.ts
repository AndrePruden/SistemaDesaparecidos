import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GeocodificacionService {
  constructor(private http: HttpClient) {}

  obtenerDireccionDesdeCoordenadas(lat: number, lon: number): Observable<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

    return this.http.get<any>(url).pipe(
      map(res => res.display_name || 'Dirección no disponible')
    );
  }
}
