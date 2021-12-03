import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupMemberbarComponent } from './memberbar.component';

describe('GroupMemberbarComponent', () => {
  let component: GroupMemberbarComponent;
  let fixture: ComponentFixture<GroupMemberbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupMemberbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupMemberbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
