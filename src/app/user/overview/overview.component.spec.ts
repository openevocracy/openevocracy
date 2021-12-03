import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserprofileOverviewComponent } from './overview.component';

describe('UserprofileOverviewComponent', () => {
  let component: UserprofileOverviewComponent;
  let fixture: ComponentFixture<UserprofileOverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserprofileOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserprofileOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
