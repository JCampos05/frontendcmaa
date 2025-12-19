import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastNoti } from './toast-noti';

describe('ToastNoti', () => {
  let component: ToastNoti;
  let fixture: ComponentFixture<ToastNoti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastNoti]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToastNoti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
