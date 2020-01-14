import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicProposalComponent } from './proposal.component';

describe('TopicProposalComponent', () => {
  let component: TopicProposalComponent;
  let fixture: ComponentFixture<TopicProposalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopicProposalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicProposalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
