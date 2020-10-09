import { FiledError } from './filed-error';

export interface Character {
	name: string;
	class: string;
	level: number;
	experience?: number;
	gold?: number;
	battleGoals?: number;
	personalQuest?: PersonalQuestTracker;
	perks?: string[];
	abilities?: number[];
	items?: number[];
	scenarioWins?: number;
	scenarioLosses?: number;
	sanctuaryDonations?: number;
	legacyCharacterName?: string;
	legacyCharacterDocId?: string;
	notes?: string;
	error?: FiledError;
}

export interface PersonalQuestTracker {
	number: number;
	tasks?: PersonalQuestTrackerTask[];
}

export interface PersonalQuestTrackerTask {
	type: "check" | "list";
	description: string;
	checkCount?: number;
	listValues?: string[];
}