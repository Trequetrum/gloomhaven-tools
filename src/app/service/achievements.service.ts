import { Injectable, OnInit } from '@angular/core';
import { DataMemoryService } from './data-memory.service';

import AchievementJson from 'src/assets/json/achievements.json';
import { GlobalAchievement, PartyAchievement } from '../model_data/achievement';

@Injectable({
  providedIn: 'root'
})
export class AchievementsService implements OnInit {

  globalAchievements = new Array<GlobalAchievement>();
  partyAchievements = new Array<PartyAchievement>();

  constructor(private data: DataMemoryService) {
    this.parseGlobalAchievements();
    this.parsePartyAchievements();
  }

  ngOnInit(): void {
    console.log(">>>> Achievements service ngOnInit()!!!");
  }

  parseGlobalAchievements(){
    for(let achievement of AchievementJson.GlobalAchievements){
      let glob = new GlobalAchievement(achievement.name);
      if(achievement.options){
        glob.options = new Array<string>();
        for (let option of achievement.options){
          glob.options.push(option);
        }
      }
      this.globalAchievements.push(glob);
    }

    console.log(this.globalAchievements);
  }

  parsePartyAchievements(){
    for(let achievement of AchievementJson.PartyAchievements){
      this.partyAchievements.push(new PartyAchievement(achievement))
    }
  }

  setAchievementsByIds(campaignId: number, partyId: number){
    this.setAchievementsByCampaignId(campaignId);
    this.setAchievementsByPartyId(partyId);
  }

  setAchievementsByCampaignId(id: number){

    /* Clear Previous Achievements */
    for(let achievement of this.globalAchievements){
      achievement.earned = false;
      achievement.selectedOption = -1;
    }

    /* Merge New Achievements */
    let acheived = this.data.getAchievementsByCampaignId(id);
    this.mergeGlobalAchievements(acheived);
  }

  setAchievementsByPartyId(id: number){
    let acheived = this.data.getAchievementsByPartyId(id);
  }
  
  mergeGlobalAchievements(achievements: GlobalAchievement[]): void {
    for(let itm of achievements){
      if(itm.earned){
        for(let achievement of this.globalAchievements){
          if(achievement.name == itm.name){
            achievement.earned = true;
            if(achievement.options && itm.options){
              if(itm.selectedOption < 0 || itm.selectedOption >= itm.options.length){
                achievement.earned = false;
              }else{
                for(let i in achievement.options){
                  if(achievement.options[i] == itm.options[itm.selectedOption]){
                    achievement.selectedOption = +i;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  mergePartyAchievements(achievements: PartyAchievement[]): void {

  }
}
