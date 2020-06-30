import { Injectable } from '@angular/core';
import { CampaignMini } from '../model_data/campaign-mini';
import { PartyMini } from '../model_data/party-mini';
import { timer, Observable } from 'rxjs';
import { Campaign } from '../model_data/campaign';
import { Party } from '../model_data/party';
import { PartyAchievement, GlobalAchievement } from '../model_data/achievement';

/**
 * In a way, the data service simply needs to maintain a bunch of lists. As specific or otherwise
 * as needed by the UI. How those arrays are maintained and updated should be a consern for the
 * data service.
 * 
 * It's not enforced by the data service though. If you use service.campaigns.push(...) instead of
 * service.addCampaign(...), then all guantees that the relevent arrays will reflect those changes is
 * out the window.
 * 
 * Consider yourself warned ;)
 **/
@Injectable({
  providedIn: 'root'
})
export class DataMemoryService {

  public campaignWithCharMinis = new Array<CampaignMini>();

  public campaignsWithChar = new Array<Campaign>();
  public partiesInCompaignsWithChar = new Array<Party>();

  constructor() {

    let campaignId = 0;
    let partyId = 0;

    /* Start the data service with 3 campaigns */

    let tmpCmpgn = new Campaign(campaignId++, false, "Campaign1");
    this.campaignsWithChar.push(tmpCmpgn);
    let tmpPrty = new Party(partyId++, false, "PartyA");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "PartyB");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, false, "PartyC");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());

    tmpCmpgn = new Campaign(campaignId++, false, "Campaign2");
    this.campaignsWithChar.push(tmpCmpgn);
    tmpPrty = new Party(partyId++, false, "PartyX");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, false, "PartyY");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "PartyZ");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    

    tmpCmpgn = new Campaign(campaignId++, true, "Realm of the Ages");
    this.campaignsWithChar.push(tmpCmpgn);
    tmpPrty = new Party(partyId++, true, "Mortar & Fire");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "Bestial Advancers");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "Impatient Imbeciles");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    

    tmpCmpgn.globalAchievements.push(new GlobalAchievement("The Drake", true, ["Slain"], 0));
    tmpCmpgn.globalAchievements.push(new GlobalAchievement("Artifact", true, ["Lost"], 0));
    tmpCmpgn.globalAchievements.push(new GlobalAchievement("The Power of Enhancement", true));

    
    /* Create our minis based off of established campaigns. Kinda backwards to how this
      will really work in the back end. Meh */

    this.campaignsWithChar.forEach(cmpgn =>
      this.campaignWithCharMinis.push(cmpgn.dev_returnMini()));
    
  }

  addCampaign(campaign: Campaign){
    // Check if this user has a character in this campaign
    // If yes, add it to campaignsWithChar & campaignsWithCharMini
  }

  getCampaignById(id: number): Observable<Campaign>{

    return new Observable<Campaign>(observer => {
      const timeoutId = setTimeout(() => {
        for(let cmpgn of this.campaignsWithChar){
          if(cmpgn.id == id){
            observer.next(Object.assign({}, cmpgn));
          }
        }
        observer.complete();
      }, 1000);

      // Unsubscribe should clear the timeout to stop execution
      return {unsubscribe() {
        clearTimeout(timeoutId);
      }};
    });
  }

  getCampaignByPartyId(id: number): Observable<Campaign>{
    return new Observable<Campaign>(observer => {
      const timeoutId = setTimeout(() => {
        for(let cmpgn of this.campaignsWithChar){
          for(let prty of cmpgn.parties){
            if(prty.id == id){
              observer.next(Object.assign({}, cmpgn));
            }
          }
        }
        observer.complete();
      }, 1000);

      // Unsubscribe should clear the timeout to stop execution
      return {unsubscribe() {
        clearTimeout(timeoutId);
      }};
    });
  }

  getPartyByPartyId(id: number): Observable<Party>{
    
    return new Observable<Party>(observer => {
      const timeoutId = setTimeout(() => {
        for(let prty of this.partiesInCompaignsWithChar){
          if(prty.id == id){
            observer.next(Object.assign({}, prty));
          }
        }
        observer.complete();
      }, 1000);

      // Unsubscribe should clear the timeout to stop execution
      return {unsubscribe() {
        clearTimeout(timeoutId);
      }};
    });

  }

  getAchievementsByPartyId(id: number): Observable<PartyAchievement[]>{
    
    return new Observable<PartyAchievement[]>(observer => {
      const timeoutId = setTimeout(() => {
        observer.next(new Array<PartyAchievement>());
        observer.complete();
      }, 1000);

      // Unsubscribe should clear the timeout to stop execution
      return {unsubscribe() {
        clearTimeout(timeoutId);
      }};
    });

  }

  getAchievementsByCampaignId(id: number): Observable<GlobalAchievement[]>{

    // Hook into getCampaignById: Observable and just emit the global achievements
    // array contained within the returned Array.
    return new Observable<GlobalAchievement[]>(observer => {
      const sub = this.getCampaignById(id).subscribe({
        next(campg){
          const clonedGlobalAchievements = new Array<GlobalAchievement>(); 
          campg.globalAchievements.forEach(val => clonedGlobalAchievements.push(Object.assign({}, val)));
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

  setAchievementsByCampaignId(id: number, globAchieves: GlobalAchievement[]) : void{
    const sub = this.getCampaignById(id).subscribe({
      next(campg){
        // Empty out the previous achievements.
        campg.globalAchievements.length = 0;

        // Add in target achievements if they've been earned
        for(let target of globAchieves){
          if(target.earned){
            campg.globalAchievements.push(target.clone());
          }
        }
      }
    });
  }
}
