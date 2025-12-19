import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SesionCerrada } from './sesion-cerrada';

describe('SesionCerrada', () => {
  let component: SesionCerrada;
  let fixture: ComponentFixture<SesionCerrada>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SesionCerrada]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SesionCerrada);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
