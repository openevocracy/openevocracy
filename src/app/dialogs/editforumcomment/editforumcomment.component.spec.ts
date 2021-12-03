import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditForumCommentDialogComponent } from './editforumcomment.component';

describe('EditForumCommentDialogComponent', () => {
  let component: EditForumCommentDialogComponent;
  let fixture: ComponentFixture<EditForumCommentDialogComponent>;

  beforeEach(waitForAsync(() => {
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
