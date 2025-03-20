import { Component, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-box',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category-box.component.html',
  styleUrl: './category-box.component.css'
})
export class CategoryBoxComponent {
  category = input<category>();

  get quizCount() {
    return (this.meta?.easy ?? 0) + (this.meta?.medium ?? 0) + (this.meta?.hard ?? 0) || 0;
  }

  get meta() {
    return this.category()!.meta;
  }
}
