import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupForumThreadlistComponent } from './groupforum.component';

describe('GroupForumThreadlistComponent', () => {
  let component: GroupForumThreadlistComponent;
  let fixture: ComponentFixture<GroupForumThreadlistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupForumThreadlistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupForumThreadlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
