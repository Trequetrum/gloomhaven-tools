import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { DataMemoryService } from 'src/app/service/data-memory.service';
import { Campaign } from 'src/app/model_data/campaign';
import { Party } from 'src/app/model_data/party';

import SampleJson from 'src/assets/json/achievements.json';
import { MatDialog } from '@angular/material/dialog';
import { SelectChiplistDialogComponent } from 'src/app/dialog/select-chiplist-dialog/select-chiplist-dialog.component';
import { ChipDialogData, ChipDialogItem } from 'src/app/model_ui/chip-dialog-data';

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

  globalAcheivementsOwned = new Array();
  globalAcheivementsLeft = new Array();
  
  partyAcheivements = SampleJson.PartyAcheivements;

  readonly GLOBAL_ACHIEVEMENTS = 0;
  viewSelect = new Array<boolean>(1);

  constructor(
    private route: ActivatedRoute, 
    private data: DataMemoryService, 
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(
      params => this.onQueryParamChange(params)
    );

    let globalAcheivements = SampleJson.GlobalAcheivements;
    if(globalAcheivements.length > 2){
      for(let i = 0; i < 3; i++){
        this.globalAcheivementsOwned.push(globalAcheivements[i]);
      }
      for(let i = 3; i < globalAcheivements.length; i++){
        this.globalAcheivementsLeft.push(globalAcheivements[i]);
      }
    }else{
      for(let acheivement of globalAcheivements){
        this.globalAcheivementsLeft.push(acheivement);
      }
    }

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

  onAddGlobalAchievements(){
    let injectData = new ChipDialogData("Global Achievements", "Select");
    for(let itm of this.globalAcheivementsLeft){
      injectData.ChipDialogItems.push(new ChipDialogItem(itm.name, itm));
    }
    let dialogRef = this.dialog.open(SelectChiplistDialogComponent, {data: injectData});

    dialogRef.afterClosed().subscribe(result => {
      console.log("result:", result);
      /* Remove the result from globalAcheivementsLeft and add it to globalAcheivementsOwned */
      if(result){
        let index = this.globalAcheivementsLeft.indexOf(result);
        if(index > -1){
          this.globalAcheivementsLeft.splice(index,1);
          this.globalAcheivementsOwned.push(result);
        }else{
          console.log('PartyComponent.onAddGlobalAchievements() index not found. This shouldn\'t happen');
        }
      }else{
        console.log('PartyComponent.onAddGlobalAchievements() dialog closed without result');
      }
    });
  }

  onRemoveGlobalAchievements(achievement: any){
    /* Remove the achievement from globalAcheivementsOwned and add it to globalAcheivementsLeft */
    if(achievement){
      let index = this.globalAcheivementsOwned.indexOf(achievement);
      if(index > -1){
        this.globalAcheivementsOwned.splice(index,1);
        this.globalAcheivementsLeft.push(achievement);
      }else{
        console.log('PartyComponent.onAddGlobalAchievements() index not found. This shouldn\'t happen');
      }
    }else{
      console.log('PartyComponent.onRemoveGlobalAchievements() called without achievement');
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
