import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss']
})
export class TransactionDetailComponent {

  constructor (private router: Router){ }

  navigateToGraph() {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/graph'])
    );
  
    window.open(url, '_blank');
  }

  navigateToTransaction() {
    //this.router.navigate(['/list']);
  }
}
