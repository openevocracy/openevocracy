import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditForumPostDialogComponent } from './editforumpost.component';

describe('EditForumPostDialogComponent', () => {
  let component: EditForumPostDialogComponent;
  let fixture: ComponentFixture<EditForumPostDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditForumPostDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditForumPostDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
