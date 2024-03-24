import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataConversionService {

  constructor() { }

  convertToHierarchy(transaction: any) {
    


  }

  createGroupHierarchy(transactions: any) {

  }

  createTransactionHierarchy(transaction: any, parentTxo: any): any {
    const txid = transaction['txid'];
    const vouts = transaction['vout'];
    const vins = transaction['vin'];

    const children: any[] = [];

    // VOUT - geo-grouped transaction output nodes (optional)
    const groupedVout: { [key: string]: any[] } = {};
    for (const vout of vouts) {
        const geoKey = vout['geolocation'];
        if (geoKey !== parentTxo['geolocation']) {
            if (!groupedVout[geoKey]) {
                groupedVout[geoKey] = [];
            }
            groupedVout[geoKey].push(vout);
        }
    }

    for (const geoKey in groupedVout) {
        const voutList = groupedVout[geoKey];
        const geoGroupedVoutTxoNode = {
            'txid': 'txo',
            'optional': true,
            'geolocation': geoKey,
            'vout_list': voutList
        };
        children.push(geoGroupedVoutTxoNode);
    }

    // VIN - geo-grouped transaction output nodes
    const groupedVin: { [key: string]: any[] } = {};
    for (const vin of vins) {
        const geoKey = vin['geolocation'];
        if (!groupedVin[geoKey]) {
            groupedVin[geoKey] = [];
        }
        groupedVin[geoKey].push(vin);
    }

    for (const geoKey in groupedVin) {
        const vinList = groupedVin[geoKey];
        const geoGroupedVinTxoNode = {
            'txid': 'txo',
            'optional': false,
            'geolocation': geoKey,
            'vin_list': vinList
        };
        children.push(geoGroupedVinTxoNode);
    }

    // transaction node
    const txNode = {
        'txid': txid,
        'parent': parentTxo,
        'children': children // including both inputs and outputs (outputs should be manually handled in d3)
    };

    return txNode;
  }

  countNumTransactions(transactions: any[], maxNumTransactions: number = 25): [boolean, number] {
    let queue: any[] = [];
    let txCount: number = 0;

    for (const tx of transactions) {
        queue.push(tx);
    }

    while (queue.length > 0) {
        if (txCount > maxNumTransactions) {
            return [true, txCount];
        }

        const transaction = queue.shift();
        if (transaction && Array.isArray(transaction.children)) {
            txCount++;

            for (const geoTxo of transaction.children) {
                if (geoTxo && !geoTxo.optional && Array.isArray(geoTxo.children)) {
                    queue.push(...geoTxo.children);
                }
            }
        }
    }

    return [false, txCount];
  }
}
