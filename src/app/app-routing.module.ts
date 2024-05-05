import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphComponent } from './graph/graph.component';
import { HomeComponent } from './home/home.component';
import { FraudTransactionListComponent } from './fraud-transaction-list/fraud-transaction-list.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'graph/:txid', component: GraphComponent },
  { path: 'suspiciousTransactions', component: FraudTransactionListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
