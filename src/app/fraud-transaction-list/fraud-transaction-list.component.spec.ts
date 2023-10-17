import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FraudTransactionListComponent } from './fraud-transaction-list.component';

describe('FraudTransactionListComponent', () => {
  let component: FraudTransactionListComponent;
  let fixture: ComponentFixture<FraudTransactionListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FraudTransactionListComponent]
    });
    fixture = TestBed.createComponent(FraudTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
