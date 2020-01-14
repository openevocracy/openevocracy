import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicGroupsComponent } from './groups.component';

describe('TopicGroupsComponent', () => {
  let component: TopicGroupsComponent;
  let fixture: ComponentFixture<TopicGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopicGroupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
