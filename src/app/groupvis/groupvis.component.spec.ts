import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupvisComponent } from './groupvis.component';

describe('GroupvisComponent', () => {
  let component: GroupvisComponent;
  let fixture: ComponentFixture<GroupvisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupvisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupvisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
