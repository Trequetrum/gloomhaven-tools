import { Injectable, OnInit } from '@angular/core';
import { DataMemoryService } from './data-memory.service';

import AchievementJson from 'src/assets/json/achievements.json';
import { GlobalAchievement, PartyAchievement } from '../model_data/achievement';

@Injectable({
  providedIn: 'root'
})
export class AchievementsService implements OnInit {

  private currentPartyId: number = -1;
  private currentGlobalId: number = -1;

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
    this.mergeGlobalAchievements(acheived, false);
  }

  setAchievementsByPartyId(id: number){
    let acheived = this.data.getAchievementsByPartyId(id);
  }
  
  mergeGlobalAchievements(achievements: GlobalAchievement[], commitMerge = true): void {
    console.log("mergeGlobalAchievements()");

    // The delta and commitMerge flags tell us whether we push our change to 
    // the backend data service
    let delta = false;
    for(let target of achievements){
      for(let source of this.globalAchievements){

        // Check for newly earned or removed achievements. If yes, make change and
        // set delta true.
        if(source.name == target.name && source.earned != target.earned){
          source.earned = target.earned;
          delta=true;
        }

        // If a target isn't earned, we don't bother to check the options in the source
        if(!target.earned){
          source.selectedOption = 0;
        
        // If the target is earned, we check the options for a delta
        }else if(source.options && target.options){

          // We compare the options by value rather than index since there is no
          // connonical order on options
          for(let i in source.options){
            // Check for matching options regardless of index
            if(source.options[i] == target.options[target.selectedOption]){

              // Check if the match found requires the index to change, if yes
              // set delta true
              if(source.selectedOption != +i){
                source.selectedOption = +i;
                delta = true;
              }
              break;
            }
          }
        }
      }
    }
    // Only commit if there are changes to the source
    if(commitMerge && delta){
      console.log("mergeGlobalAchievements() : Commit!");
      this.data.setAchievementsByCampaignId(this.currentGlobalId, this.globalAchievements);
    }
  }

  mergePartyAchievements(achievements: PartyAchievement[], commitMerge = true): void {

  }
}
