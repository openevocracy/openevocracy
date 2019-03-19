import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AskDeleteDialogComponent } from './askdelete.component';

describe('AskDeleteDialogComponent', () => {
  let component: AskDeleteDialogComponent;
  let fixture: ComponentFixture<AskDeleteDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AskDeleteDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AskDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
