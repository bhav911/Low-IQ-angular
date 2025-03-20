import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  @Input() pageCount: number = 0;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  getRange(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  onPageClick(page: number): void {
    if (page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }
}
