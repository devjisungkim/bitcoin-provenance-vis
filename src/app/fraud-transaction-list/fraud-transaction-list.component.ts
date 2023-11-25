import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-fraud-transaction-list',
  templateUrl: './fraud-transaction-list.component.html',
  styleUrls: ['./fraud-transaction-list.component.scss']
})
export class FraudTransactionListComponent {
  fraudList = ["1e6b2572ba028e84861b1968f0a8623a0d2b38397116058401a3fa94373698bc", 
    "b338d45aadd43752d0eabb5f5276dfd30ced165f88f0c3ddcd78761b8d8ec379"]

  constructor(private router: Router) {}

  navigateToGraph(id:string) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/graph', id])
    );
    window.open(url, '_blank');
  }
}
