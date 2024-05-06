import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForceGraphComponent } from './force-graph.component';

describe('ForceGraphComponent', () => {
  let component: ForceGraphComponent;
  let fixture: ComponentFixture<ForceGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ForceGraphComponent]
    });
    fixture = TestBed.createComponent(ForceGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
