import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupForumComponent } from './forum.component';

describe('GroupForumComponent', () => {
  let component: GroupForumComponent;
  let fixture: ComponentFixture<GroupForumComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupForumComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupForumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
