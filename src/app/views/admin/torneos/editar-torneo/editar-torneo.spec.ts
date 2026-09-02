import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarTorneo } from './editar-torneo';

describe('EditarTorneo', () => {
  let component: EditarTorneo;
  let fixture: ComponentFixture<EditarTorneo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarTorneo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarTorneo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
