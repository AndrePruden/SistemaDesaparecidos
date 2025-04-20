import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAvistamientosComponent } from './form-avistamientos.component';

describe('FormAvistamientosComponent', () => {
  let component: FormAvistamientosComponent;
  let fixture: ComponentFixture<FormAvistamientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAvistamientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormAvistamientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
