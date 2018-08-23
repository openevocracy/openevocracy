import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorFieldComponent } from './editorfield.component';

describe('EditorFieldComponent', () => {
  let component: EditorFieldComponent;
  let fixture: ComponentFixture<EditorFieldComponent>;

  beforeEach(async(() => {
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
