import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TopicOverviewComponent } from './overview.component';

describe('TopicOverviewComponent', () => {
  let component: TopicOverviewComponent;
  let fixture: ComponentFixture<TopicOverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TopicOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
