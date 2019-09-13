import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupToolbarComponent } from './header.component';

describe('GroupToolbarComponent', () => {
  let component: GroupToolbarComponent;
  let fixture: ComponentFixture<GroupToolbarComponent>;

  beforeEach(async(() => {
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
