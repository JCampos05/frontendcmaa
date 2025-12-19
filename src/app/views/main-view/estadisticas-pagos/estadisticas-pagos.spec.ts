import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticasPagos } from './estadisticas-pagos';

describe('EstadisticasPagos', () => {
  let component: EstadisticasPagos;
  let fixture: ComponentFixture<EstadisticasPagos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasPagos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstadisticasPagos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
