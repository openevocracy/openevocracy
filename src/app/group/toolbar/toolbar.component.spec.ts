import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupToolbarComponent } from './toolbar.component';

describe('GroupToolbarComponent', () => {
  let component: GroupToolbarComponent;
  let fixture: ComponentFixture<GroupToolbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupToolbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
