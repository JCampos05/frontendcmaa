import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionTorneos } from './configuracion-torneos';

describe('ConfiguracionTorneos', () => {
  let component: ConfiguracionTorneos;
  let fixture: ComponentFixture<ConfiguracionTorneos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionTorneos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfiguracionTorneos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
