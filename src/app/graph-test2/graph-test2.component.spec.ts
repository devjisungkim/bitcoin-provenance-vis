import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphTest2Component } from './graph-test2.component';

describe('GraphTest2Component', () => {
  let component: GraphTest2Component;
  let fixture: ComponentFixture<GraphTest2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GraphTest2Component]
    });
    fixture = TestBed.createComponent(GraphTest2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
