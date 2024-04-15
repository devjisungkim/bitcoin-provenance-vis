import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DataRetrievalService } from 'src/services/data-retrieval/data-retrieval.service';

@Component({
  selector: 'app-fraud-transaction-list',
  templateUrl: './fraud-transaction-list.component.html',
  styleUrls: ['./fraud-transaction-list.component.scss']
})
export class FraudTransactionListComponent implements OnInit {
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 10;
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  susTransactionList: any[] = [];
  paginatedSusTransactionList: any[] = [];
  totalPages: number = 0;
  visiblePages: number[] = [];
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private dataRetrievalService: DataRetrievalService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.dataRetrievalService.getSuspiciousTransactions().subscribe((data) => {
      this.susTransactionList = data;
      this.totalPages = Math.ceil(this.susTransactionList.length / this.itemsPerPage);
      this.isLoading = false;
      this.updatePagination();
    });
  }

  updatePagination(): void {
    const pageCount = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(pageCount / 2));
    const endPage = Math.min(this.totalPages, startPage + pageCount - 1);
    this.visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    this.paginatedSusTransactionList = this.susTransactionList.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.pageChange.emit(page);
      this.updatePagination();
    }
  }

  get midpoint(): number {
    return Math.ceil(this.paginatedSusTransactionList.length / 2);
  }

  navigateToGraph(txid: string) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dev2', txid])
    );
    window.open(url, '_blank');
  }
}
