import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelojSection } from './reloj-section';

describe('RelojSection', () => {
  let component: RelojSection;
  let fixture: ComponentFixture<RelojSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelojSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelojSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
