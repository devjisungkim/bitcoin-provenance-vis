import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {

  private rawTransactionData: { [key: string]: any } = {};
  private forceDataSubject = new BehaviorSubject<{ txid: string, nodes: any[], links: any[] }>({ txid: '', nodes: [], links: [] });
  forceData$ = this.forceDataSubject.asObservable();

  constructor(
    ) { }

  public addRawTransaction(transaction: any): void {
    this.rawTransactionData[transaction.txid] = transaction;
  }

  public getRawTransaction(txid: string) {
    return this.rawTransactionData[txid];
  }

  public setForceData(newForceData: { txid: string, nodes: any[], links: any[] }): void {
    this.forceDataSubject.next(newForceData);
  }
}
