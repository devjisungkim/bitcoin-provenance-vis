import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphTest3Component } from './graph-test3.component';

describe('GraphTest3Component', () => {
  let component: GraphTest3Component;
  let fixture: ComponentFixture<GraphTest3Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GraphTest3Component]
    });
    fixture = TestBed.createComponent(GraphTest3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
