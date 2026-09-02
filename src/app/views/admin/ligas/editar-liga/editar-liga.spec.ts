import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarLiga } from './editar-liga';

describe('EditarLiga', () => {
  let component: EditarLiga;
  let fixture: ComponentFixture<EditarLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
