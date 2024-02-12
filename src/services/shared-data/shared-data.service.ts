import { Injectable } from '@angular/core';
import { DataRetrievalService } from '../data-retrieval/data-retrieval.service';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private pathData: any;
  private originData: any;
  private destData: any;

  constructor(
    private dataRetrievalService: DataRetrievalService
    ) { }

  setPathData(data: any) {
    this.pathData = data;
  }

  setOriginData(data: any) {
    this.originData = data;
  }
  
  setDestData(data: any) {
    this.destData = data;
  }

  getPathData(tx1: string, tx2: string) {
    // Placeholder (should request from API)
    const path = {}
    this.setPathData(path)

    return this.pathData;
  }

  getOriginData(txid: string) {


    return this.originData;
  }

  getDestData(txid: string) {
    return this.destData;
  }
}
