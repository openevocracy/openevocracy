import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CloseEditorDialogComponent } from './closeeditor.component';

describe('CloseEditorDialogComponent', () => {
  let component: CloseEditorDialogComponent;
  let fixture: ComponentFixture<CloseEditorDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CloseEditorDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
