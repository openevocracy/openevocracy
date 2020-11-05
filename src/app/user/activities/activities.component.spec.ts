import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserprofileActivityComponent } from './activities.component';

describe('UserprofileActivityComponent', () => {
  let component: UserprofileActivityComponent;
  let fixture: ComponentFixture<UserprofileActivityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserprofileActivityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserprofileActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
