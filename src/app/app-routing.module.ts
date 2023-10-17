import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphComponent } from './graph/graph.component';
import { HomeComponent } from './home/home.component';
import { TransactionDetailComponent } from './transaction-detail/transaction-detail.component';
import { FraudTransactionListComponent } from './fraud-transaction-list/fraud-transaction-list.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'graph', component: GraphComponent },
  { path: 'list', component: FraudTransactionListComponent },
  { path: 'detail', component: TransactionDetailComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
