import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  searchForm!: FormGroup;
  pathForm!: FormGroup;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.searchForm = this.formBuilder.group({
      transaction: ['', Validators.required]
    });

    this.pathForm = this.formBuilder.group({
      from: ['', Validators.required],
      to: ['', Validators.required]
    });
  }

  visualizeTransaction() {
    
  }

  visualizePath() {

  }

  navigateToGraph() {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/graph'])
    );
    window.open(url, '_blank');
  }
}
