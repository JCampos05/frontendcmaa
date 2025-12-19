import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadoTodosTorneos } from './resultado-todos-torneos';

describe('ResultadoTodosTorneos', () => {
  let component: ResultadoTodosTorneos;
  let fixture: ComponentFixture<ResultadoTodosTorneos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadoTodosTorneos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultadoTodosTorneos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
