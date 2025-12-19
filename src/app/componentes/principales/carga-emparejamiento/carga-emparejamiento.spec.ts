import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaEmparejamiento } from './carga-emparejamiento';

describe('CargaEmparejamiento', () => {
  let component: CargaEmparejamiento;
  let fixture: ComponentFixture<CargaEmparejamiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaEmparejamiento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargaEmparejamiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
