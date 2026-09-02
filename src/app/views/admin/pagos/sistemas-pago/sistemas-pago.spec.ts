import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SistemasPago } from './sistemas-pago';

describe('SistemasPago', () => {
  let component: SistemasPago;
  let fixture: ComponentFixture<SistemasPago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SistemasPago]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SistemasPago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
