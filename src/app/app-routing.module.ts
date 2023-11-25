import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphComponent } from './graph/graph.component';
import { HomeComponent } from './home/home.component';
import { TransactionDetailComponent } from './transaction-detail/transaction-detail.component';
import { FraudTransactionListComponent } from './fraud-transaction-list/fraud-transaction-list.component';
import { GraphTestComponent } from './graph-test/graph-test.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'graph/:id', component: GraphComponent },
  { path: 'list', component: FraudTransactionListComponent },
  //{ path: 'detail', component: TransactionDetailComponent },
  { path: 'test', component: GraphTestComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
