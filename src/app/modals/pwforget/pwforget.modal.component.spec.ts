import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPwforgetComponent } from './modal-pwforget.component';

describe('ModalPwforgetComponent', () => {
  let component: ModalPwforgetComponent;
  let fixture: ComponentFixture<ModalPwforgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalPwforgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalPwforgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
