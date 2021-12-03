import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupWelcomeDialogComponent } from './groupwelcome.component';

describe('GroupWelcomeDialogComponent', () => {
  let component: GroupWelcomeDialogComponent;
  let fixture: ComponentFixture<GroupWelcomeDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupWelcomeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupWelcomeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
