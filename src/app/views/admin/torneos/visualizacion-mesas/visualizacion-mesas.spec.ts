import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizacionMesas } from './visualizacion-mesas';

describe('VisualizacionMesas', () => {
  let component: VisualizacionMesas;
  let fixture: ComponentFixture<VisualizacionMesas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizacionMesas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisualizacionMesas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
