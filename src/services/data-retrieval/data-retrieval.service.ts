import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRetrievalService {

  url: string = '/assets/';

  constructor(
    private http: HttpClient
    ) { }

  getDestinationData(txid: string): Observable<JSON> {
    const jsonURL = this.url + 'dest_' + txid + '.json';
    return this.http.get<JSON>(jsonURL);
  }

  // this function groups the dummy data (re-uses it for multiple groups)
  generatePerformanceData(txid: string): Promise<{ txid: string; children: any[] }> {
    return new Promise((resolve) => {
      this.getDestinationData(txid).subscribe((data: any) => {
        const root: { txid: string; children: any[] } = {
          txid: data.txid,
          children: []
        };
  
        const numChildren = data.children.length;
  
        root.children.push(this.groupTransactions(0, data.children[0]));
        root.children.push(this.groupTransactions(1, data.children[0]));

        resolve(root);
      });
    });
  }
  

  groupTransactions(groupid: number, transactions: any) {
    return {
      txid: transactions.txid,
      from: transactions.from,
      to: transactions.to+groupid,
      value: transactions.value,
      children: [
        {
          txid: `cluster${groupid}`,
          transactions: [transactions]
        }
      ]
    };
  }
}
