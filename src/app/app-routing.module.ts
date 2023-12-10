import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphComponent } from './graph/graph.component';
import { HomeComponent } from './home/home.component';
import { TransactionDetailComponent } from './transaction-detail/transaction-detail.component';
import { FraudTransactionListComponent } from './fraud-transaction-list/fraud-transaction-list.component';
import { GraphTestComponent } from './graph-test/graph-test.component';
import { GraphTest2Component } from './graph-test2/graph-test2.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'graph/:id', component: GraphComponent },
  { path: 'list', component: FraudTransactionListComponent },
  //{ path: 'detail', component: TransactionDetailComponent },
  { path: 'test1', component: GraphTestComponent },
  { path: 'test2', component: GraphTest2Component },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
