import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRetrievalService {

  url: string = '/assets/example_data.json';

  constructor(
    private http: HttpClient
    ) { }

  requestHierarchyData(): Observable<JSON> {
    return this.http.get<JSON>(this.url);
  }
}
