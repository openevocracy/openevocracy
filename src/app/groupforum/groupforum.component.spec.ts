import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupForumComponent } from './groupforum.component';

describe('GroupForumComponent', () => {
  let component: GroupForumComponent;
  let fixture: ComponentFixture<GroupForumComponent>;

  beforeEach(async(() => {
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
