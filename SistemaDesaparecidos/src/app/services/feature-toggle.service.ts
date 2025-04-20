import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeatureToggleService {
  private features: { [key: string]: boolean } = {
    reportes: true 
  };

  isFeatureEnabled(featureName: string): boolean {
    return this.features[featureName];
  }
}