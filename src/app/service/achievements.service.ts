import { Injectable } from '@angular/core';

import AchievementJson from 'src/assets/json/achievements.json';
import { GlobalAchievement, PartyAchievement } from '../model_data/achievement';
import { Observable } from 'rxjs';

/********************
 * Achievments given by the API are only those which are earned. This service parses
 * a JSON file to make our app aware of all possible achievements. It can connect to
 * the backend to return a list of earned AND unearned achievements.
 ********************/
@Injectable({
  providedIn: 'root',
})
export class AchievementsService {
  private globalAchievements = new Array<GlobalAchievement>();
  private partyAchievements = new Array<PartyAchievement>();

  constructor() {
    this.parseGlobalAchievements();
    this.parsePartyAchievements();
  }

  private parseGlobalAchievements() {
    for (let achievement of AchievementJson.GlobalAchievements) {
      let glob = new GlobalAchievement(achievement.name);
      if (achievement.options) {
        glob.options = new Array<string>();
        for (let option of achievement.options) {
          glob.options.push(option);
        }
      }
      this.globalAchievements.push(glob);
    }

    console.log(this.globalAchievements);
  }

  private parsePartyAchievements() {
    for (let achievement of AchievementJson.PartyAchievements) {
      this.partyAchievements.push(new PartyAchievement(achievement));
    }
  }
}
