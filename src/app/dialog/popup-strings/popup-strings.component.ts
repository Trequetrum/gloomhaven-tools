import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
	selector: 'app-popup-strings',
	templateUrl: './popup-strings.component.html',
	styleUrls: ['./popup-strings.component.scss'],
})
export class PopupStringsComponent implements OnInit {
	title: string;
	messages: string[];
	constructor(@Inject(MAT_DIALOG_DATA) private dialogData: string[]) {
		if (dialogData.length > 0) {
			this.title = dialogData.shift();
			this.messages = dialogData;
		} else {
			this.title = 'Message';
		}
	}

	ngOnInit(): void {}
}
