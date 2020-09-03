import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from 'src/app/service/data.service';
import { ClassDataService } from 'src/app/service/class-data.service';

@Component({
	selector: 'app-create-character-form',
	templateUrl: './create-character-form.component.html',
	styleUrls: ['./create-character-form.component.scss'],
})
export class CreateCharacterFormComponent implements OnInit {
	@Output() newDocId: EventEmitter<string> = new EventEmitter<string>();

	newCharacterForm = new FormGroup({
		newCharacterName: new FormControl(''),
		newCharacterClass: new FormControl(''),
	});

	classPicked: string;

	constructor(private data: DataService, private classData: ClassDataService) {
		this.classPicked = 'No Class Selected';
	}

	ngOnInit(): void {}

	onClassPicked(val) {
		console.log(val);
		this.classPicked = val;
	}

	createNewCharacter(): void {
		//console.log(this.newCharacterForm.value);
	}
}
