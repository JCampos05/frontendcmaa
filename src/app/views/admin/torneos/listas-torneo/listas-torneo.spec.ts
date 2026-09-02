import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListasTorneo } from './listas-torneo';

describe('ListasTorneo', () => {
  let component: ListasTorneo;
  let fixture: ComponentFixture<ListasTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListasTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListasTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
