import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditorFieldComponent } from './editorfield.component';

describe('EditorFieldComponent', () => {
  let component: EditorFieldComponent;
  let fixture: ComponentFixture<EditorFieldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditorFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
