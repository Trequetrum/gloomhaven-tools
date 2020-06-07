import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {FormControl, Validators, FormGroupDirective, NgForm} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import { DirtyErrorStateMatcher } from 'src/app/util/dirty-error-state-matcher';

@Component({
  selector: 'app-input-initiative',
  templateUrl: './input-initiative.component.html',
  styleUrls: ['./input-initiative.component.scss']
})
export class InputInitiativeComponent {

  //initiative = new FormControl('', [Validators.pattern('^[a-z]*$')] );
  initiative = new FormControl('', [Validators.max(99), Validators.min(0), Validators.pattern('[0-9][0-9]?')] );
  matcher = new DirtyErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<InputInitiativeComponent>) { 
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getErrorMessage() {
    if (this.initiative.hasError('max')){
      return 'Initiative must be < 100';
    }
    if (this.initiative.hasError('min')){
      return 'Initiative must be positive';
    }
    if (this.initiative.hasError('pattern')){
      return 'Initiative must be a number';
    }
    return 'Unkown Error with input';
  }
}