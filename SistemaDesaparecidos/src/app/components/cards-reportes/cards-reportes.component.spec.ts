import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsReportesComponent } from './cards-reportes.component';

describe('CardsReportesComponent', () => {
  let component: CardsReportesComponent;
  let fixture: ComponentFixture<CardsReportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsReportesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
