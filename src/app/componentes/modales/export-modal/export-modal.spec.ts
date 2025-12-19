import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportModal } from './export-modal';

describe('ExportModal', () => {
  let component: ExportModal;
  let fixture: ComponentFixture<ExportModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
