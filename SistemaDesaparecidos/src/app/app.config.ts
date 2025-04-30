import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { FeatureFlagsService } from './services/feature-flags.service';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(HttpClientModule),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideClientHydration(withEventReplay()),
    provideRouter(routes),
    {
      provide: 'APP_INITIALIZER',
      useFactory: cargarFeatureFlags,
      deps: [FeatureFlagsService, HttpClient],
      multi: true
    }
  ]
};

export function cargarFeatureFlags(
  featureFlagsService: FeatureFlagsService,
  http: HttpClient
) {
  return () => {
    console.log('🚀 Cargando feature flags desde backend...');
    return http.get<{ [key: string]: boolean }>('/config/feature-flags')
      .toPromise()
      .then(flags => {
        console.log('🚩 Feature flags recibidos:', flags);
        featureFlagsService.setFlags(flags || {}); 
      })
      .catch(error => {
        console.error('❌ Error al cargar feature flags:', error);
        featureFlagsService.setFlags({}); 
      });
  };
}