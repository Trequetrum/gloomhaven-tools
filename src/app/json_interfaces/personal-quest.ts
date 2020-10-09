export interface PersonalQuest {
	number: number;
	name: string;
	description: string;
	reward: {
		type: "OpenCharacterWithIcon" | "OpenEnvelopeWithIcon";
		value: string;
	};
	tasks: PersonalQuestTask[];
}

export interface PersonalQuestTask {
	type: "check" | "list";
	description: string;
	count?: number;
}
