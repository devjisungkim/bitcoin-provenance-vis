import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRetrievalService {

  url: string = '/assets/';

  constructor(
    private http: HttpClient
    ) { }

  getDestinationDummy(id: string): Observable<JSON> {
    const jsonURL = this.url + id + '_dest.json'
    return this.http.get<JSON>(jsonURL);
  }

  getTransactionMetadata(id: string): Observable<JSON> {
    return this.http.get<any>(this.url + 'metadata.json').pipe(
      map(metadata => metadata.metadata_array.find((entry:any) => entry.id === id))
    );
  }

  getOriginDummy(id: string): Observable<JSON> {
    const jsonURL = this.url + id + '_origin.json'
    return this.http.get<JSON>(jsonURL);
  }
}
