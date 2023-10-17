import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fraud-transaction-list',
  templateUrl: './fraud-transaction-list.component.html',
  styleUrls: ['./fraud-transaction-list.component.scss']
})
export class FraudTransactionListComponent {

  constructor(private router: Router) {}

  navigateToDetail() {
    this.router.navigate(['/detail']);
  }
}
