import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAddtopicComponent } from './addtopic.modal.component';

describe('ModalAddtopicComponent', () => {
  let component: ModalAddtopicComponent;
  let fixture: ComponentFixture<ModalAddtopicComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalAddtopicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalAddtopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
