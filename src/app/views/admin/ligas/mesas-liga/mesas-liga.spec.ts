import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesasLiga } from './mesas-liga';

describe('MesasLiga', () => {
  let component: MesasLiga;
  let fixture: ComponentFixture<MesasLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesasLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesasLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
