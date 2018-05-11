import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCloseeditorComponent } from './closeeditor.modal.component';

describe('ModalCloseeditorComponent', () => {
  let component: ModalCloseeditorComponent;
  let fixture: ComponentFixture<ModalCloseeditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalCloseeditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalCloseeditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
