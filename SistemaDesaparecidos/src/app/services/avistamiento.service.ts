import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Avistamiento {
  idAvistamiento: number;
  emailUsuario: string;
  lugarDesaparicionLegible?: string;
  ubicacion: string;
  fecha: string;
  descripcion: string;
  personaDesaparecida: {
    idDesaparecido?: number | null;
    nombre: string;
    lugarDesaparicion?: string;
    fechaDesaparicion?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AvistamientoService {
  private baseUrl = 'https://sistemadesaparecidos-production.up.railway.app/avistamientos';

  private avistamientoCambiadoSource = new Subject<void>();

  avistamientoCambiado$ = this.avistamientoCambiadoSource.asObservable();

  constructor(private http: HttpClient) {}

  crearAvistamiento(avistamiento: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear`, avistamiento)
      .pipe(
        tap(response => {
          console.log('Avistamiento creado en backend:', response);
          this.avistamientoCambiadoSource.next();
       }),
       catchError(this.handleError)
      );
  }

  obtenerAvistamientoPorId(id: number): Observable<Avistamiento> {
    console.log('Solicitando avistamiento con ID:', id);
    return this.http.get<Avistamiento>(`${this.baseUrl}/${id}`).pipe(
      tap(data => console.log('Avistamiento recibido por ID:', data)),
      catchError(this.handleError)
    );
  }

  actualizarAvistamiento(id: number, avistamientoData: any): Observable<any> {
    console.log(`Intentando actualizar avistamiento ${id}:`, avistamientoData);
    return this.http.put(`${this.baseUrl}/${id}`, avistamientoData)
      .pipe(
        tap(response => {
          console.log('Avistamiento actualizado en backend:', response);
          this.avistamientoCambiadoSource.next();
        }),
        catchError(this.handleError)
      );
  }

  obtenerAvistamientosPorUsuario(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usuario/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  obtenerAvistamientosPorReporte(id: number): Observable<any[]> {
    console.log('Solicitando avistamientos para el reporte con ID:', id);
    return this.http.get<any[]>(`${this.baseUrl}/reporte/${id}`).pipe(
      tap(data => console.log('Avistamientos recibidos del backend:', data)),
      catchError(this.handleError)
    );
  }

  obtenerUltimoAvistamiento(idReporte: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ultimo/${idReporte}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  obtenerTodosLosAvistamientos(): Observable<Avistamiento[]> {
    return this.http.get<Avistamiento[]>(`${this.baseUrl}/todos`)
      .pipe(
        tap(data => console.log('Todos los avistamientos recibidos (incluyendo emailUsuario):', data)),
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('Ocurrió un error en AvistamientoService:', error);
    let errorMessage = 'Error desconocido en el servicio';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status} - ${error.message || ''} ${error.error?.message || ''}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  obtenerReportesFiltrados(nombre: string, lugar: string, fecha: string) {
    const params = {
      nombre,
      lugar,
      fecha
    };
    return this.http.get<any[]>(`${this.baseUrl}/filtrar`, { params });
  }

   parsearCoords(ubicacion: string | undefined): [number, number] | null {
       if (!ubicacion) return null;
       const partes = ubicacion.split(',').map(part => parseFloat(part.trim()));
       if (partes.length === 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
           return [partes[0], partes[1]];
       }
       console.warn('Formato de coordenadas no válido:', ubicacion);
       return null;
   }
}