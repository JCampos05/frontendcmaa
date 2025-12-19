import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoTorneo } from './nuevo-torneo';

describe('NuevoTorneo', () => {
  let component: NuevoTorneo;
  let fixture: ComponentFixture<NuevoTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevoTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
