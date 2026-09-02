import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesLiga } from './detalles-liga';

describe('DetallesLiga', () => {
  let component: DetallesLiga;
  let fixture: ComponentFixture<DetallesLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
