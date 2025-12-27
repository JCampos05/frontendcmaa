import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvertenciaEdicionMesa } from './advertencia-edicion-mesa';

describe('AdvertenciaEdicionMesa', () => {
  let component: AdvertenciaEdicionMesa;
  let fixture: ComponentFixture<AdvertenciaEdicionMesa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvertenciaEdicionMesa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvertenciaEdicionMesa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
