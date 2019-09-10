import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupForumThreadComponent } from './groupforumthread.component';

describe('GroupForumThreadComponent', () => {
  let component: GroupForumThreadComponent;
  let fixture: ComponentFixture<GroupForumThreadComponent>;

  beforeEach(async(() => {
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
