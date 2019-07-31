import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditForumCommentDialogComponent } from './editforumcomment.component';

describe('EditForumCommentDialogComponent', () => {
  let component: EditForumCommentDialogComponent;
  let fixture: ComponentFixture<EditForumCommentDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditForumCommentDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditForumCommentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
