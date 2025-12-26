import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargarRankingExcel } from './cargar-ranking-excel';

describe('CargarRankingExcel', () => {
  let component: CargarRankingExcel;
  let fixture: ComponentFixture<CargarRankingExcel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargarRankingExcel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargarRankingExcel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
