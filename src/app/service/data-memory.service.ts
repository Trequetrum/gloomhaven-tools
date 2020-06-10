import { Injectable } from '@angular/core';
import { CampaignMini } from '../model_data/campaign-mini';
import { PartyMini } from '../model_data/party-mini';
import { timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataMemoryService {

  campaignMinis = new Array<CampaignMini>();

  constructor() {

    let campaignId = 0;
    let partyId = 0;

    /* Start the data service with campaign1 */
    this.campaignMinis.push(new CampaignMini(campaignId++, `path/to/resourse/campaign/${campaignId}`, "Campaign1", 
      [ new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "PartyA"),
        new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "PartyB"),
        new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "PartyC")
      ]));

    /* After 10 Seconds, the backend adds campaign2 to the data service. This should be reflected in the frontend */
    timer(10000).subscribe(val => {
        this.campaignMinis.push(new CampaignMini(campaignId++, `path/to/resourse/campaign/${campaignId}`, "Campaign2", 
          [ new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "PartyA"),
            new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "PartyB"),
            new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "PartyC")
          ]));
      })

    /* After 20 Seconds, the backend adds campaign3 to the data service. This should be reflected in the frontend */
    timer(20000).subscribe(val => {
        this.campaignMinis.push(new CampaignMini(campaignId++, `path/to/resourse/campaign/${campaignId}`, "Realm of the Ages", 
          [ new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "Mortar & Fire"),
            new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "Bestial Advancers"),
            new PartyMini(partyId++, `path/to/resourse/party/${partyId}`, "Impatient Imbeciles")
          ]));
      })
  }

  getCampaignMinis(): Array<CampaignMini>{
    return this.campaignMinis;
  }

}
