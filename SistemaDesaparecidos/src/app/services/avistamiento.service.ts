import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError , Subject} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Definición de la interfaz Avistamiento (Asegúrate que coincide con el backend)
export interface Avistamiento {
  idAvistamiento?: number; // Puede ser opcional para la creación, pero presente para edición
  emailUsuario: string;
  lugarDesaparicionLegible?: string | null; // Propiedad calculada en frontend
  ubicacion: string; // Coordenadas (ej. "Lat, Lng")
  fecha: string; // Fecha (ej. "YYYY-MM-DD")
  descripcion: string | null;
  coordenadas?: string; // Añadido para el input readonly en el form

  // Estructura esperada para personaDesaparecida. Puede que solo necesites idDesaparecido para el payload de creación/actualización
  personaDesaparecida: {
    id?: number | null; // A veces el backend usa 'id'
    idDesaparecido: number | null; // A veces el backend usa 'idDesaparecido'
    nombre?: string | null;
    lugarDesaparicion?: string | null;
    fechaDesaparicion?: string | null;
  } | null | undefined;
}


@Injectable({
  providedIn: 'root'
})
export class AvistamientoService {
   private baseUrl = 'https://sistemadesaparecidos-production-6b5e.up.railway.app/avistamientos'; // Usar esta en producción
  //private baseUrl = 'http://localhost:8080/avistamientos'; // Usar esta en desarrollo

  // --- Renombrar a avistamientoCambiadoSource para consistencia ---
  private avistamientoCambiadoSource = new Subject<void>();
  avistamientoCambiado$ = this.avistamientoCambiadoSource.asObservable();

  constructor(private http: HttpClient) {}

  crearAvistamiento(avistamiento: any): Observable<any> {
    console.log('[SERVICE][FRONT] 📤 Enviando POST /avistamientos/crear:', avistamiento);
    return this.http.post(`${this.baseUrl}/crear`, avistamiento)
      .pipe(
        tap(response => {
          console.log('[SERVICE][FRONT] ✅ Avistamiento creado con éxito en backend:', response);
          this.avistamientoCambiadoSource.next(); // Notificar después de crear
       }),
       catchError(this.handleError)
      );
  }

  obtenerAvistamientoPorId(id: number): Observable<Avistamiento> {
    console.log(`[SERVICE][FRONT] 📩 Solicitando GET /avistamientos/${id}`);
    return this.http.get<Avistamiento>(`${this.baseUrl}/${id}`).pipe(
      tap(data => console.log(`[SERVICE][FRONT] ✅ Avistamiento ${id} recibido:`, data)),
      catchError(this.handleError)
    );
  }
  
  actualizarAvistamiento(id: number, avistamientoData: Partial<Avistamiento>): Observable<any> {
    console.log(`[SERVICE][FRONT] 📤 Intentando PUT /avistamientos/${id}:`, avistamientoData);
    return this.http.put(`${this.baseUrl}/${id}`, avistamientoData)
      .pipe(
        tap(response => {
          console.log(`[SERVICE][FRONT] ✅ Avistamiento ${id} actualizado en backend:`, response);
          this.avistamientoCambiadoSource.next(); // Notificar después de actualizar
        }),
        catchError(this.handleError)
      );
  }

  obtenerAvistamientosPorUsuario(email: string): Observable<any[]> {
     console.log(`[SERVICE][FRONT] 📩 Solicitando GET /avistamientos/usuario/${email}`);
    return this.http.get<any[]>(`${this.baseUrl}/usuario/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  obtenerAvistamientosPorReporte(id: number): Observable<any[]> {
    console.log('[SERVICE][FRONT] Solicitando avistamientos para el reporte con ID:', id);
    return this.http.get<any[]>(`${this.baseUrl}/reporte/${id}`).pipe(
      tap(data => console.log('[SERVICE][FRONT] Avistamientos recibidos del backend:', data)),
      catchError(this.handleError)
    );
  }

  obtenerUltimoAvistamiento(idReporte: number): Observable<Avistamiento | null> {
    console.log(`[SERVICE][FRONT] 📩 Solicitando GET /avistamientos/ultimo/${idReporte}`);
     
    return this.http.get<Avistamiento>(`${this.baseUrl}/ultimo/${idReporte}`)
      .pipe(
        catchError(error => {
            
             console.error(`[SERVICE][FRONT] Error al obtener último avistamiento para reporte ${idReporte}:`, error);
            if (error.status === 404) {
                console.log(`[SERVICE][FRONT] Último avistamiento para reporte ${idReporte} no encontrado (404) - retornado null.`);
                 return new Observable<null>(subscriber => {
                     subscriber.next(null);
                     subscriber.complete();
                 });
            }
             // Para otros errores, re-lanzar
            return throwError(() => new Error(error.message || `Error desconocido al obtener último avistamiento para reporte ${idReporte}`));
        })
      );
  }


  obtenerTodosLosAvistamientos(): Observable<Avistamiento[]> {
     console.log('[SERVICE][FRONT] 📩 Solicitando GET /avistamientos/todos');
    return this.http.get<Avistamiento[]>(`${this.baseUrl}/todos`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('[SERVICE][FRONT] ❌ Ocurrió un error:', error);
     let errorMessage = 'Error desconocido en el servicio';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente o de red: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status}`;
      if (error.statusText) errorMessage += ` - ${error.statusText}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
          errorMessage += `: ${error.error.message}`;
      } else if (typeof error.error === 'string' && error.error.length > 0) {
           errorMessage += `: ${error.error}`;
      }
      else if (error.message) {
           errorMessage += ` - ${error.message}`;
      }
    }
     console.error('[SERVICE][FRONT] Mensaje de error final:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  
  obtenerReportesFiltrados(nombre: string, lugar: string, fecha: string) {
    const params = {
      nombre,
      lugar,
      fecha
    };
     console.log('[SERVICE][FRONT] Solicitando GET /avistamientos/filtrar (Nota: este endpoint es de reportes filtrados?)');
    return this.http.get<any[]>(`${this.baseUrl}/filtrar`, { params }) 
     .pipe(catchError(this.handleError)); 
  }

   
   parsearCoords(ubicacion: string | undefined | null): [number, number] | null {
       if (!ubicacion) {
            return null;
       }
       const partes = ubicacion.split(',').map(part => parseFloat(part.trim()));
       if (partes.length === 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
           return [partes[0], partes[1]];
       }
       console.warn('[SERVICE][FRONT] Formato de coordenadas no válido para parsear:', ubicacion);
       return null;
   }
}