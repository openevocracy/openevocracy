import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupDocumentComponent } from './document.component';

describe('GroupDocumentComponent', () => {
  let component: GroupDocumentComponent;
  let fixture: ComponentFixture<GroupDocumentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
