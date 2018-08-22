import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewThreadDialogComponent } from './newthread.component';

describe('NewThreadDialogComponent', () => {
  let component: NewThreadDialogComponent;
  let fixture: ComponentFixture<NewThreadDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewThreadDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewThreadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
