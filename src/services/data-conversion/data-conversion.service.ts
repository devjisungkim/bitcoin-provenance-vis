import { Injectable } from '@angular/core';
import * as d3 from 'd3';

declare var require: any
var iso3311a2 = require('../../../node_modules/iso-3166-1-alpha-2')

@Injectable({
  providedIn: 'root'
})
export class DataConversionService {

  private grouping: boolean = false;
  private uniqueTxoId: number = 1;
  private threshold: number = 3;
  private totalNumTransactionsRetrieved: number = -1; // -1 to exclude root transaction

  constructor() { }

  public convertToHierarchy(txid: string, transaction: any, parentTxo: any = null) {
    const transactionHierarchy = this.createTransactionHierarchy(txid, transaction, parentTxo);
    this.totalNumTransactionsRetrieved += 1;
    return transactionHierarchy;
  }

  private createTransactionHierarchy(txid: string, transaction: any, parentTxo: any = null): any {
    const vouts = transaction.vout;
    const vins = transaction.vin;

    const children: any[] = [];

    const median = (arr: number[]) => {
      const mid = Math.floor(arr.length / 2),
        nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };

    /*
    // VOUT - geo-grouped transaction output nodes (optional)
    const groupedVout: { [key: string]: any[] } = {};
    for (const vout of vouts) {
      const geoKey = vout.geolocation;
      if (parentTxo && geoKey !== parentTxo.geolocation) {
        if (!groupedVout[geoKey]) {
          groupedVout[geoKey] = [];
        }
        groupedVout[geoKey].push(vout);
      }
    }

    const sortedVoutKeys = Object.keys(groupedVout).sort();

    for (const geoKey of sortedVoutKeys) {
      const voutList = groupedVout[geoKey];
      const totalValue = voutList.reduce((total, vout) => total + vout.value, 0);

      const displayData = {
        'geolocation': iso3311a2.getCountry(geoKey),
        'totalValue': totalValue + 'BTC',
      }

      const geoGroupedVoutTxoNode = {
          'txid': 'txo' + this.uniqueTxoId,
          'type': 'vout',
          'displayData': displayData
      };
      this.uniqueTxoId++;
      children.push(geoGroupedVoutTxoNode);
    }
    */
    // VIN - geo-grouped transaction output nodes
    const groupedVin: { [key: string]: any[] } = {};
    for (const vin of vins) {
      const geoKey = vin.geolocation;
      if (!groupedVin[geoKey]) {
        groupedVin[geoKey] = [];
      }
      groupedVin[geoKey].push(vin);
    }

    const sortedVinKeys = Object.keys(groupedVin).sort();

    for (const geoKey of sortedVinKeys) {
      const vinList = groupedVin[geoKey];
      const vinTxids = vinList.map(vin => vin.txid);
      const values = vinList.map(vin => vin.value);
      const totalValue = values.reduce((a, b) => a + b, 0);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const medianValue = median(values)

      const supervisedAlertProbabilities = vinList.map(vin => vin.supervised_alert_probability);
      const numSuspicious = supervisedAlertProbabilities.filter(proba => proba > 0.5).length;
      const minFraudProba = (Math.min(...supervisedAlertProbabilities)*100).toFixed(2);
      const maxFraudProba = (Math.max(...supervisedAlertProbabilities)*100).toFixed(2);
      const medianFraudProba = (median(supervisedAlertProbabilities)*100).toFixed(2);

      const displayData: { [key: string]: any } = {
        'Geolocation': iso3311a2.getCountry(geoKey),
        'Number of Suspicious Inputs': numSuspicious,
        'Total Inputs': vinList.length,
        'Total Value': totalValue + ' BTC',
        'Min. Value': minValue + ' BTC',
        'Med. Value': medianValue + ' BTC',
        'Max. Value': maxValue + ' BTC',
        'Min. Fraud Probability': minFraudProba + '%',
        'Med. Fraud Probability': medianFraudProba + '%',
        'Max. Fraud Probability': maxFraudProba + '%',
      }

      const geoGroupedVinTxoNode = {
        'txid': 'txo' + this.uniqueTxoId,
        'type': 'vin',
        'vinTxids': vinTxids,
        'totalValue': totalValue,
        'geolocation': geoKey,
        'numInputs': vinList.length,
        'maxFraudProba': maxFraudProba,
        'displayData': displayData
      };
      this.uniqueTxoId++;
      children.push(geoGroupedVinTxoNode);
    }

    // transaction node
    const txNode = {
      'txid': txid,
      'children': children // including both inputs and outputs (outputs should be manually handled in d3)
    };

    const d3TxNode = this.convertToD3Hierarchy(txNode);

    return d3TxNode;
  }

  public countNumTransactions(transactions: any[]): number {
    let queue: any[] = [];
    let txCount: number = 0;

    if (transactions.length === 0) {
      return 0;
    }

    for (const tx of transactions) {
      queue.push(tx);
    }

    while (queue.length > 0) {
      const transaction = queue.shift();
      txCount++;
      if (transaction.children && Array.isArray(transaction.children)) {
        for (const geoTxo of transaction.children) {
          if (geoTxo.data.type === 'vin' && geoTxo.children && Array.isArray(geoTxo.children)) {
            queue.push(...geoTxo.children);
          }
        }
      }
    }
    return txCount;
  }

  private groupTransactions(transactions: any[]): [{}, any[], any[]] {
    let indexedGroupedTransactions: { [key: string]: { [key: string]: any } } = {};
    let txCount: number = 0;
    let topLevelTxList: any[] = []
    let nextDepthQueue: any[] = []
    let currentDepthQueue: any[] = []

    for (const tx of transactions) {
       currentDepthQueue.push([tx, 0]);
    }

    while (currentDepthQueue.length > 0) {
      if (txCount < this.threshold) {
        const [transaction, depth] = currentDepthQueue.shift();

        if (depth === 0) {
          topLevelTxList.push(transaction)
        }

        indexedGroupedTransactions[transaction['data']['txid']] = transaction;

        if (transaction.children && Array.isArray(transaction.children)) {
          for (const geoTxo of transaction.children) {
            if (geoTxo.data.type === 'vin' && geoTxo.children && Array.isArray(geoTxo.children)) {
              for (const tx of geoTxo.children) {
                currentDepthQueue.push([tx, depth + 1]);
              }
            }
          }
        }
        txCount += 1;
      } else {
        break;
      }

      if (currentDepthQueue.length === 0 && nextDepthQueue.length > 0 && txCount < this.threshold) {
        currentDepthQueue = nextDepthQueue;
        nextDepthQueue = [];
      };
    }

    const combinedQueue: any[] = [];
    if (nextDepthQueue) {
      combinedQueue.push(...nextDepthQueue.map(pair => pair[0]));
    }
    if (currentDepthQueue) {
      combinedQueue.push(...currentDepthQueue.map(pair => pair[0]));
    }

    return [indexedGroupedTransactions, combinedQueue, topLevelTxList];
  }

  public createGroupHierarchy(newQueue: any[], groupId: number, startingGeolocation: string, parentNode: any): any {
    const children: any[] = [];

    const [indexedGroupedTransactions, nextQueue, txList] = this.groupTransactions(newQueue);

    const numTransactionsInGroup = Object.keys(indexedGroupedTransactions).length;
    const displayData = {
      'Group\'s Starting Geolocation': iso3311a2.getCountry(startingGeolocation),
      'Total Transactions': numTransactionsInGroup,
    }

    const groupNode: any = {
      'txid': 'group' + groupId,
      'startingGeolocation': startingGeolocation,
      'totalNumTransactions': numTransactionsInGroup,
      'transactions': undefined,
      'displayData': displayData,
      'children': []
    }

    groupNode['transactions'] = this.transformBackToHierarchy(txList, indexedGroupedTransactions)

    const d3GroupNode = this.convertToD3Hierarchy(groupNode);
    d3GroupNode.parent = parentNode;

    if (nextQueue.length === 0) {
      children.push(d3GroupNode)
    } else {
      let newGroupId = parseInt(groupId.toString() + '1');

      const geoGroups: { [key: string]: any[] } = {};
      for (const tx of nextQueue) {  
        const parentGeo = tx.parent.data.geolocation;
          geoGroups[parentGeo] = geoGroups[parentGeo] || [];
          geoGroups[parentGeo].push(tx);
      }
      
      for (const [geoKey, value] of Object.entries(geoGroups)) {
        const nStartingTx: number = 3;
        const chunks: any[][] = [];
        for (let j = 0; j < value.length; j += nStartingTx) {
          chunks.push(value.slice(j, j + nStartingTx));
        }
        
        for (const chunk of chunks) {
          if (!d3GroupNode.children) {
            d3GroupNode.children = []; 
          }
          d3GroupNode.children.push(...this.createGroupHierarchy(chunk, newGroupId, geoKey, d3GroupNode));
          newGroupId++;
        }
      }
      children.push(d3GroupNode)
    }

    this.grouping = true;
    return children;
  }

  private transformBackToHierarchy(txList: any[], indexedGroupedTransactions: { [key: string]: { [key: string]: any } }): any[] {
    const finalList: any[] = [];

    for (const tx of txList) {
      const tx1 = indexedGroupedTransactions[tx.data.txid];

      if (tx1['children'] && Array.isArray(tx1['children'])) {
        const transactionChildren: any[] = [];

        for (const geoTxo of tx1['children']) {
          geoTxo.children = [];
          
          for (const txid of geoTxo.data.vinTxids) {
            if (indexedGroupedTransactions.hasOwnProperty(txid)) {
              geoTxo.children.push(...this.transformBackToHierarchy([indexedGroupedTransactions[txid]], indexedGroupedTransactions));
            }
          }

          if (geoTxo.children.length === 0) {
            geoTxo.children = null;
          }

          transactionChildren.push(geoTxo);
        }
        tx1['children'] = transactionChildren;
      }
      finalList.push(tx1);
    }
    return finalList;
  }

  public getTotalNumTransactionsRetrieved(): number {
    return this.totalNumTransactionsRetrieved;
  }

  public groupingInitiated(): boolean {
    return this.grouping;
  }

  private convertToD3Hierarchy(hierarchy: any) {
    return d3.hierarchy(hierarchy)
  }

  public getThreshold() {
    return this.threshold;
  }
}
