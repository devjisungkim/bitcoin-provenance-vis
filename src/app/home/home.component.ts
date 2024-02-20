import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  originDestForm!: FormGroup;
  pathForm!: FormGroup;
  originDestErrorMessage: string = '';
  pathErrorMessage: string = '';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    const transactionIdRegex = /^[0-9a-fA-F]{64}$/;

    this.originDestForm = this.formBuilder.group({
      tx: ['', [Validators.required, Validators.pattern(transactionIdRegex)]]
    });

    this.pathForm = this.formBuilder.group({
      tx1: ['', [Validators.required, Validators.pattern(transactionIdRegex)]],
      tx2: ['', [Validators.required, Validators.pattern(transactionIdRegex)]]
    });
  }

  navigateToOriginDest() {
    const tx = this.originDestForm.get('tx')?.value;
  
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dev2/origindest'], { queryParams: { tx: tx } })
    );
    window.open(url, '_blank');
  }

  navigateToPath() {
    const tx1 = this.pathForm.get('tx1')?.value;
    const tx2 = this.pathForm.get('tx2')?.value;

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dev2/path'], { queryParams: { tx1: tx1, tx2: tx2 } })
    );
    window.open(url, '_blank');
  }
}
