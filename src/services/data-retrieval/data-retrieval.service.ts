import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRetrievalService {

  url: string = 'http://localhost:5000/api/';
  //url: string = 'https://doe-good-formally.ngrok-free.app/';

  headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'skip',
    'Access-Control-Allow-Origin': '*',
  });

  constructor(
    private http: HttpClient
    ) {  }

  private requestTransaction(txid: string): Observable<any> {
    /*
    const jsonURL = `${this.url}get_transaction`;
    return this.http.get(jsonURL, { headers: this.headers, params: { transaction_id: txid } })
    */
    
    const jsonURL = `${this.url}getTransaction/${txid}`;
    return this.http.get(jsonURL, { headers: this.headers });
    
  }

  public getTransactions(txidList: string[]): Observable<any[]> {
    const observables = txidList.map(txid => {
      return this.requestTransaction(txid).pipe(
        map((response: any) => response)
      );
    });
    return forkJoin(observables);
  }

  public getSuspiciousTransactions(): Observable<any> {
    const jsonURL = `${this.url}get_alert_data`;
    return this.http.get(jsonURL, { headers: this.headers })
  }
}