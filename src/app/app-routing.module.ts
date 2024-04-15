import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphComponent } from './graph/graph.component';
import { HomeComponent } from './home/home.component';
import { TransactionDetailComponent } from './transaction-detail/transaction-detail.component';
import { FraudTransactionListComponent } from './fraud-transaction-list/fraud-transaction-list.component';
import { GraphTestComponent } from './graph-test/graph-test.component';
import { GraphTest2Component } from './graph-test2/graph-test2.component';
import { GraphTest3Component } from './graph-test3/graph-test3.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'graph/:txid', component: GraphComponent },
  { path: 'suspiciousTransactions', component: FraudTransactionListComponent },
  //{ path: 'detail', component: TransactionDetailComponent },
  { path: 'dev1/:txid', component: GraphTestComponent },
  { path: 'dev2/:txid', component: GraphTest2Component },
  { path: 'dev3/:txid', component:GraphTest3Component }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
