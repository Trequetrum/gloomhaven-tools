import { GlobalAchievement } from '../model_data/achievement';
import { Party } from '../model_data/party';

export interface Campaign {
	name?: string,
	globalAchievements?: GlobalAchievement[],
	parties?: Party[]
}


