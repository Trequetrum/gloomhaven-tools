import { Injectable } from '@angular/core';
import { CampaignMini } from '../model_data/campaign-mini';
import { PartyMini } from '../model_data/party-mini';
import { timer } from 'rxjs';
import { Campaign } from '../model_data/campaign';
import { Party } from '../model_data/party';

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
    let tmpPrty = new Party(partyId++, false, "PartyA");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "PartyB");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, false, "PartyC");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    this.campaignsWithChar.push(tmpCmpgn);

    tmpCmpgn = new Campaign(campaignId++, false, "Campaign2");
    tmpPrty = new Party(partyId++, false, "PartyX");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, false, "PartyY");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "PartyZ");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    this.campaignsWithChar.push(tmpCmpgn);

    tmpCmpgn = new Campaign(campaignId++, true, "Realm of the Ages");
    tmpPrty = new Party(partyId++, true, "Mortar & Fire");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "Bestial Advancers");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    tmpPrty = new Party(partyId++, true, "Impatient Imbeciles");
    this.partiesInCompaignsWithChar.push(tmpPrty);
    tmpCmpgn.parties.push(tmpPrty.dev_returnMini());
    this.campaignsWithChar.push(tmpCmpgn);
    
    /* Create our minis based off of established campaigns. Kinda backwards to how this
      will really work in the back end. Meh */

    this.campaignsWithChar.forEach(cmpgn =>
      this.campaignWithCharMinis.push(cmpgn.dev_returnMini()));

    /******************************* <TESTING> ***************************************
    After 10 Seconds, the backend adds campaign2 to the data service. This should be reflected in the frontend 
    timer(10000).subscribe(val => {
        this.campaignMinis.push(new CampaignMini(campaignId++, "Campaign2", 
          [ new PartyMini(partyId++, "PartyA"),
            new PartyMini(partyId++, "PartyB"),
            new PartyMini(partyId++, "PartyC")
          ]));
      })

    After 20 Seconds, the backend adds campaign3 to the data service. This should be reflected in the frontend 
    timer(20000).subscribe(val => {
        this.campaignMinis.push(new CampaignMini(campaignId++, "Realm of the Ages", 
          [ new PartyMini(partyId++, "Mortar & Fire"),
            new PartyMini(partyId++, "Bestial Advancers"),
            new PartyMini(partyId++, "Impatient Imbeciles")
          ]));
      })
    ******************************** </TESTING> ***************************************/
    
  }

  addCampaign(campaign: Campaign){
    // Check if this user has a chracter in this campaign
    // If yes, add it to campaignsWithChar & campaignsWithCharMini
  }

  getCampaignById(id: number): Campaign{
    for(let cmpgn of this.campaignsWithChar){
      if(cmpgn.id == id){
        return cmpgn;
      }
    }
    return null;
  }

  getCampaignByPartyId(id: number): Campaign{

    for(let cmpgn of this.campaignsWithChar){
      for(let prty of cmpgn.parties){
        if(prty.id == id){
          return cmpgn;
        }
      }
    }
    return null;
  }

  getPartyByPartyId(id: number): Party{
    for(let prty of this.partiesInCompaignsWithChar){
      if(prty.id == id){
        return prty;
      }
    }
    return null;
  }

}
