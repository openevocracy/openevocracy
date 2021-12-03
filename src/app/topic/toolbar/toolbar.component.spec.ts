import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TopicToolbarComponent } from './toolbar.component';

describe('TopicToolbarComponent', () => {
  let component: TopicToolbarComponent;
  let fixture: ComponentFixture<TopicToolbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TopicToolbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
