import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRetrievalService {

  url: string = 'http://localhost:5000/api/';

  constructor(
    private http: HttpClient
    ) {  }

  requestTransaction(txid: string): Observable<any> {
    const headers = new HttpHeaders({
      'ngrok-skip-browser-warning': 'skip'
    });
    
    const jsonURL = `${this.url}getTransaction/${txid}`;
    return this.http.get(jsonURL, {headers: headers, params: {txid: txid}})
  }
}
