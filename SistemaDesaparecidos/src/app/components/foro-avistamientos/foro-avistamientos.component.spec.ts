import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForoAvistamientosComponent } from './foro-avistamientos.component';

describe('ForoAvistamientosComponent', () => {
  let component: ForoAvistamientosComponent;
  let fixture: ComponentFixture<ForoAvistamientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForoAvistamientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForoAvistamientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
