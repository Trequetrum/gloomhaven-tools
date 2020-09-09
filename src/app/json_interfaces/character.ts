import { FiledError } from './filed-error';

export interface Character {
	name: string;
	class: string;
	level: number;
	experience?: number;
	gold?: number;
	battleGoals?: number;
	personalQuest?: {
		number: number;
		count?: number;
		note?: string;
	};
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
