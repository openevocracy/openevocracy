import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicStagebarComponent } from './stagebar.component';

describe('TopicStagebarComponent', () => {
  let component: TopicStagebarComponent;
  let fixture: ComponentFixture<TopicStagebarComponent>;

  beforeEach(async(() => {
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
