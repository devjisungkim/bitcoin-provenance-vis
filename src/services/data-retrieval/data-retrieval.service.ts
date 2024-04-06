import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRetrievalService {

  url: string = 'http://localhost:5000/api/';

  constructor(
    private http: HttpClient
    ) {  }

  private requestTransaction(txid: string): Observable<any> {
    const headers = new HttpHeaders({
      'ngrok-skip-browser-warning': 'skip'
    });
    
    const jsonURL = `${this.url}getTransaction/${txid}`;
    return this.http.get(jsonURL, {headers: headers, params: {txid: txid}})
  }

  public getTransactions(txid_list: string[]): Observable<any[]> {
    const observables = txid_list.map(txid => {
      return this.requestTransaction(txid).pipe(
        map((response: any) => response.transaction)
      );
    });

    return forkJoin(observables);
  }
}
