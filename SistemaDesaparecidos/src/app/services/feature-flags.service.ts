import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagsService {
  private flags: { [key: string]: boolean } = {};
  //private apiUrl = 'http://sistemadesaparecidos-production-6b5e.up.railway.app/config';
  private apiUrl = 'http://localhost:8080/config';

  constructor(private http: HttpClient) {
    console.log('FeatureFlagsService inicializado');
  }

  setFlags(flags: { [key: string]: boolean }): void {
    this.flags = flags;
    console.log('Feature flags configurados:', this.flags);
  }

  getFeatureFlag(featureName: string): Observable<boolean>  {
    const enabled = this.http.get<boolean>(`${this.apiUrl}/feature-toggles/${featureName}`);
    console.log(`Consultando feature '${featureName}':`, enabled);
    return enabled;
  }

  loadFeatureFlags(): Observable<{ [key: string]: boolean }> {
    return this.http.get<{ [key: string]: boolean }>(`${this.apiUrl}/feature-flags`);
  }
}