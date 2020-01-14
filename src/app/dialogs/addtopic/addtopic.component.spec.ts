import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddtopicDialogComponent } from './addtopic.component';

describe('AddtopicDialogComponent', () => {
  let component: AddtopicDialogComponent;
  let fixture: ComponentFixture<AddtopicDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddtopicDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddtopicDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
