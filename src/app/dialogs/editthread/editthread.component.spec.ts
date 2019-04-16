import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditThreadDialogComponent } from './editthread.component';

describe('EditThreadDialogComponent', () => {
  let component: EditThreadDialogComponent;
  let fixture: ComponentFixture<EditThreadDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditThreadDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditThreadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
