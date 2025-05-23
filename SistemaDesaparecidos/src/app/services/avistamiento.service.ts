import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError , Subject} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AvistamientoService {
  private baseUrl = 'https://sistemadesaparecidos-production.up.railway.app/avistamientos';


  private avistamientoCreadoSource = new Subject<void>(); 


  avistamientoCreado$ = this.avistamientoCreadoSource.asObservable();

  constructor(private http: HttpClient) {}

  crearAvistamiento(avistamiento: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear`, avistamiento)
      .pipe(
        tap(response => { 
          console.log('Avistamiento creado en backend:', response);
          this.avistamientoCreadoSource.next(); 
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

  obtenerTodosLosAvistamientos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/todos`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('Ocurrió un error:', error);
    return throwError(() => new Error(error.message || 'Error en el servicio'));
  }

  obtenerReportesFiltrados(nombre: string, lugar: string, fecha: string) {
    const params = {
      nombre,
      lugar,
      fecha
    };
    return this.http.get<any[]>(`${this.baseUrl}/filtrar`, { params });
  }
}