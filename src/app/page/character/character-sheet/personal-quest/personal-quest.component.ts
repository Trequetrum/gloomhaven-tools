import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PersonalQuestService } from 'src/app/service/json-service/personal-quest.service';
import { SelectPersonalQuestComponent } from '../../dialog/select-personal-quest/select-personal-quest.component';
import { UpdatePersonalQuestComponent } from '../../dialog/update-personal-quest/update-personal-quest.component';

@Component({
	selector: 'app-personal-quest',
	templateUrl: './personal-quest.component.html',
	styleUrls: ['./personal-quest.component.scss']
})
export class PersonalQuestComponent implements OnInit {

	pQControl = new FormControl(510);

	constructor(public dialog: MatDialog, public pQService: PersonalQuestService) {
	}

	ngOnInit(): void {
		this.pQControl.disable();
	}

	selectPersonalQuest() {
		console.log(">>>>> Clicked selectPersonalQuest");
		const dialogRef = this.dialog.open(SelectPersonalQuestComponent);
		dialogRef.afterClosed().subscribe(result => {
			console.log(`TODO: selectPersonalQuest=${result}`);
		});
	}

	updatePersonalQuest() {
		console.log(">>>>> Clicked updatePersonalQuest");
		const dialogRef = this.dialog.open(UpdatePersonalQuestComponent);
		dialogRef.afterClosed().subscribe(result => {
			console.log(`TODO: updatePersonalQuest=${result}`);
		});
	}

}
