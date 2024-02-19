import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRetrievalService {

  url: string = 'https://7daa-220-245-42-224.ngrok-free.app/api/';

  constructor(
    private http: HttpClient,
    ) {  }

  requestOriginDest(txid: string): Observable<any> {
    const headers = new HttpHeaders({
      'ngrok-skip-browser-warning': 'any_value'
    });
    
    const jsonURL = `${this.url}getOriginDest/${txid}`;
    return this.http.get(jsonURL, {headers: headers, params: {txid: txid}})
  }

  requestPath(txid1:string, txid2: string): Observable<any>  {
    const jsonURL = `${this.url}getPath/${txid1}&${txid2}`;
    return this.http.get(jsonURL);
  }

  /*
  generatePerformanceData(txid: string): Promise<{ txid: string; children: any[] }> {
    return new Promise((resolve) => {
      this.getDestinationData(txid).subscribe((data: any) => {
        const root: { txid: string; children: any[] } = {
          txid: data.txid,
          children: []
        };
  
        const numChildren = data.children.length;
  
        root.children.push(this.groupTransactions('0', data.children[0], true));
        root.children.push(this.groupTransactions('1', data.children[0], true));
        root.children.push(this.groupTransactions('2', data.children[0], true));
        
        resolve(root);
      });
    });
  }
  */

  /*
  groupTransactions(groupid: string, transactions: any, rootConnected: boolean) {
    if (rootConnected) {
      return {
        txid: transactions.txid,
        from: transactions.from,
        to: transactions.to+groupid,
        value: transactions.value,
        children: [
          {
            txid: `cluster${groupid}`,
            transactions: [transactions.children[0]],
            children: []
          }
        ]
      };
    } else {
      return {
        txid: `cluster${groupid}`,
        transactions: [transactions],
        children: []
      }
    }
  }
  */
}
