import { TestBed } from '@angular/core/testing';

import { GeocodificacionService } from './geocodificacion.service';

describe('GeocodificacionService', () => {
  let service: GeocodificacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeocodificacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
