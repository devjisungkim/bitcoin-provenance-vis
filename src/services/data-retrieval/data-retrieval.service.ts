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

  private requestTransaction(txid: string, unixTime: number | undefined = undefined): Observable<any> {
    const jsonURL = `${this.url}get_transaction`;
    const params: any = { transaction_id: txid };
    if (this.url === "http://localhost:5000/api/" && unixTime) params.unix_time = unixTime;
    return this.http.get(jsonURL, { headers: this.headers, params: params })
  }

  public getTransactions(txidList: string[], unixTime: number | undefined = undefined): Observable<any[]> {
    const observables = txidList.map(txid => {
      return this.requestTransaction(txid, unixTime).pipe(
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