import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TopicStagebarComponent } from './stagebar.component';

describe('TopicStagebarComponent', () => {
  let component: TopicStagebarComponent;
  let fixture: ComponentFixture<TopicStagebarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TopicStagebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStagebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
