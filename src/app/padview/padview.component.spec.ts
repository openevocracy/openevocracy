import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PadviewComponent } from './padview.component';

describe('PadviewComponent', () => {
  let component: PadviewComponent;
  let fixture: ComponentFixture<PadviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PadviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PadviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
