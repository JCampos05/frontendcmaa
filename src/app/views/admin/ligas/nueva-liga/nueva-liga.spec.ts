import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaLiga } from './nueva-liga';

describe('NuevaLiga', () => {
  let component: NuevaLiga;
  let fixture: ComponentFixture<NuevaLiga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaLiga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaLiga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
