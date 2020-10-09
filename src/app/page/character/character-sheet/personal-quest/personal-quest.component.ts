import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PersonalQuestService } from 'src/app/service/json/personal-quest.service';

@Component({
	selector: 'app-personal-quest',
	templateUrl: './personal-quest.component.html',
	styleUrls: ['./personal-quest.component.scss']
})
export class PersonalQuestComponent implements OnInit {

	pQControl = new FormControl(510);

	constructor(public pQService: PersonalQuestService) {
	}

	ngOnInit(): void {
		this.pQControl.disable();
	}

	selectPersonalQuest() {
		console.log(">>>>> Clicked selectPersonalQuest")
	}

	updatePersonalQuest() {
		console.log(">>>>> Clicked updatePersonalQuest")
	}

}
