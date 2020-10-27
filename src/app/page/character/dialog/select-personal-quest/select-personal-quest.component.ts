import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-select-personal-quest',
	templateUrl: './select-personal-quest.component.html',
	styleUrls: ['./select-personal-quest.component.scss']
})
export class SelectPersonalQuestComponent {

	constructor(
		public dialogRef: MatDialogRef<SelectPersonalQuestComponent>) {
	}

}
