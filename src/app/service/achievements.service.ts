import { Injectable } from '@angular/core';
import { DataMemoryService } from './data-memory.service';

import AchievementJson from 'src/assets/json/achievements.json';
import { GlobalAchievement, PartyAchievement } from '../model_data/achievement';
import { Observable } from 'rxjs';

/********************
 * Achievments given by the API are only those which are earned. This service parses
 * a JSON file to make our app aware of all possible achievements. It can connect to
 * the backend to return a list of earned AND unearned achievements. 
 ********************/
@Injectable({
  providedIn: 'root'
})
export class AchievementsService{

  private globalAchievements = new Array<GlobalAchievement>();
  private partyAchievements = new Array<PartyAchievement>();

  constructor(private data: DataMemoryService) {
    this.parseGlobalAchievements();
    this.parsePartyAchievements();
  }

  private parseGlobalAchievements(){
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

  private parsePartyAchievements(){
    for(let achievement of AchievementJson.PartyAchievements){
      this.partyAchievements.push(new PartyAchievement(achievement))
    }
  }

  getAndFillAchievementsByCampaignId(id: number): Observable<GlobalAchievement[]>{

    // Hook into getCampaignById: Observable and just emit the global achievements
    // array contained within the returned Array.
    return new Observable<GlobalAchievement[]>(observer => {
      const sub = this.data.getAchievementsByCampaignId(id).subscribe({
        next(globList: GlobalAchievement[]){
          // Clone a list of the full achievements
          const clonedGlobalAchievements = new Array<GlobalAchievement>(); 
          this.globalAchievements.forEach(val => clonedGlobalAchievements.push(Object.assign({}, val)));

          // Merge by setting earned and selectedOption where appropriate. 
          for(let source of clonedGlobalAchievements){
            for(let target of globList){
              if(target.earned && source.name == target.name){
                source.earned = true;
                if(source.options){
                  for(let i in source.options){
                    if(source.options[i] == target.options[target.selectedOption]){
                      source.selectedOption = +i;
                    }
                  }
                }
              }
            }
          }

          observer.next(clonedGlobalAchievements);
        },
        complete(){
          observer.complete();
        }
      });

      // Unsubscribe just passes along to the getCampaignById: Observable
      return {unsubscribe() {
        sub.unsubscribe();
      }};
    });


    
  }

  getAndFillAchievementsByPartyId(id: number) : Observable<PartyAchievement[]>{
    let acheived = this.data.getAchievementsByPartyId(id);

    return new Observable<PartyAchievement[]>(observer => {
      const sub = this.data.getAchievementsByPartyId(id).subscribe({
        next(partyList: PartyAchievement[]){
          // Clone a list of the full achievements
          const clonedPartyAchievements = new Array<PartyAchievement>(); 
          this.partyAchievements.forEach(val => clonedPartyAchievements.push(Object.assign({}, val)));

          // Merge by setting earned where appropriate. 
          for(let source of clonedPartyAchievements){
            for(let target of partyList){
              if(target.earned && source.name == target.name){
                source.earned = true;
              }
            }
          }

          observer.next(clonedPartyAchievements);
        },
        complete(){
          observer.complete();
        }
      });

      // Unsubscribe just passes along to the getCampaignById: Observable
      return {unsubscribe() {
        sub.unsubscribe();
      }};
    });

  }

}
