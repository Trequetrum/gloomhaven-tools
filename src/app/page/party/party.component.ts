import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { DataMemoryService } from 'src/app/service/data-memory.service';
import { Campaign } from 'src/app/model_data/campaign';
import { Party } from 'src/app/model_data/party';

@Component({
  selector: 'app-party',
  templateUrl: './party.component.html',
  styleUrls: ['./party.component.scss']
})
export class PartyComponent implements OnInit {

  paramError = false;
  newParty: boolean;
  campaign: Campaign;
  party: Party;

  readonly GLOBAL_ACHIEVEMENTS = 0;
  viewSelect = new Array<boolean>(1);

  constructor(
    private route: ActivatedRoute, 
    private data: DataMemoryService) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(
      params => this.onQueryParamChange(params)
    );
  }
  
  onQueryParamChange(params: Params){
    console.log(`Query Params: ${params}`); // {id: "number"}

    if(params.id){
      if(params.id < 0){
        this.newParty = true;
      }else{
        this.newParty = false;
        this.campaign = this.data.getCampaignByPartyId(params.id);
        this.party = this.data.getPartyByPartyId(params.id);
        if(!(this.campaign && this.party)){
          this.paramError = true;
        }
      }
    }else{
      this.paramError = true;
    }
  }

  setSingleView(view: number){
    console.log(`Set view: ${view}`);
    // Clear all view (set them false)
    for(let i in this.viewSelect){
      console.log(`i:${i}`);
      this.viewSelect[i] = false;
    }
    // Set the view we've been passed in
    if (view < this.viewSelect.length) {
      console.log(`Setting... `);
      this.viewSelect[view] = true;
      console.log(`this.viewSelect[view] = ${this.viewSelect[view]}`);
    }
  }
}
