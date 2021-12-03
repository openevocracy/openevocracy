import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupForumThreadComponent } from './thread.component';

describe('GroupForumThreadComponent', () => {
  let component: GroupForumThreadComponent;
  let fixture: ComponentFixture<GroupForumThreadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupForumThreadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupForumThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
