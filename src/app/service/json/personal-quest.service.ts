import { Injectable } from '@angular/core';
import { PersonalQuest } from 'src/app/json_interfaces/personal-quest';

import PQJson from 'src/assets/json/personal-quests.json';
@Injectable({
	providedIn: 'root'
})
export class PersonalQuestService {

	private personalQuests: PersonalQuest[];
	constructor() {
		// This JSON is defined in the backend, so if it's not the correct shape, that's on me
		// So we just tell typescript that the typing I've defined is correct
		this.personalQuests = PQJson.personalQuests as PersonalQuest[];
	}

	isPersonalQuestNumber(id: number) {
		return this.personalQuests.findIndex(quest => quest.number === id) !== -1;
	}
}
