import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesasTorneo } from './mesas-torneo';

describe('MesasTorneo', () => {
  let component: MesasTorneo;
  let fixture: ComponentFixture<MesasTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesasTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesasTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
