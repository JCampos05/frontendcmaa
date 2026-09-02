import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JugadoresTorneo } from './jugadores-torneo';

describe('JugadoresTorneo', () => {
  let component: JugadoresTorneo;
  let fixture: ComponentFixture<JugadoresTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JugadoresTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JugadoresTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
