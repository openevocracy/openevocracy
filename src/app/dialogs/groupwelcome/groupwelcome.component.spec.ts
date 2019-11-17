import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupWelcomeDialogComponent } from './GroupWelcome.component';

describe('GroupWelcomeDialogComponent', () => {
  let component: GroupWelcomeDialogComponent;
  let fixture: ComponentFixture<GroupWelcomeDialogComponent>;

  beforeEach(async(() => {
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
