import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportarReportes } from './exportar-reportes';

describe('ExportarReportes', () => {
  let component: ExportarReportes;
  let fixture: ComponentFixture<ExportarReportes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportarReportes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportarReportes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
