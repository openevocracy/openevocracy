import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginEmailDialogComponent } from './loginemail.component';

describe('LoginEmailDialogComponent', () => {
  let component: LoginEmailDialogComponent;
  let fixture: ComponentFixture<LoginEmailDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginEmailDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginEmailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
