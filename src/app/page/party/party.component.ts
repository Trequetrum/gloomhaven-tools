import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { DataMemoryService } from 'src/app/service/data-memory.service';
import { Campaign } from 'src/app/model_data/campaign';
import { Party } from 'src/app/model_data/party';

import { MatDialog } from '@angular/material/dialog';
import { SelectChiplistDialogComponent } from 'src/app/dialog/select-chiplist-dialog/select-chiplist-dialog.component';
import { ChipDialogData, ChipDialogItem, ChipDialogSubItem } from 'src/app/model_ui/chip-dialog-data';
import { AchievementsService } from 'src/app/service/achievements.service';
import { GlobalAchievement } from 'src/app/model_data/achievement';

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
    private data: DataMemoryService,
    public dialog: MatDialog,
    achievements: AchievementsService) { 
      
    }

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
        this.achievements.setAchievementsByIds(this.campaign.id, this.party.id);
        if(!(this.campaign && this.party)){
          this.paramError = true;
        }
      }
    }else{
      this.paramError = true;
    }
  }

  onAddGlobalAchievements(){
    /* Collect all unearned achievements and send them to the dialog */
    let injectData = new ChipDialogData("Global Achievements", "Select");
    console.log("Iterating over global achievements: ", this.achievements.globalAchievements);
    for(let globAcheiv of this.achievements.globalAchievements){
      console.log("Looking at global achievement: ", globAcheiv);
      if(!globAcheiv.earned){
        let chipItm;
        if(globAcheiv.options){
          chipItm = new ChipDialogItem(globAcheiv.name, null);
          for(let option of globAcheiv.options){
            chipItm.subMenu.push(new ChipDialogSubItem(`: ${option}`, new GlobalAchievement(globAcheiv.name, true, [option], 0)));
          }
        }else{
          chipItm = new ChipDialogItem(globAcheiv.name, new GlobalAchievement(globAcheiv.name, true));
        }
        if(chipItm){ /* Sanity Check, this should never fail */
          console.log("Pushing chipItm: ", chipItm);
          injectData.chipDialogItems.push(chipItm);
        }
      }
    }
    console.log("Injecting: ", injectData);
    let dialogRef = this.dialog.open(SelectChiplistDialogComponent, {data: injectData});

    /* Wait on result and deal with any newly earned achievements */
    dialogRef.afterClosed().subscribe(result => {
      console.log("result:", result);
      if(result instanceof GlobalAchievement){
        this.achievements.mergeGlobalAchievements([result]);
      }else{
        console.log('PartyComponent.onAddGlobalAchievements() dialog closed without result');
      }
    });
  }

  /**
   * Expects to be given a reference to an achievement found in this.achievements.globalAchievements.
   * We can use the referense directly (no lookup needed)
   */
  onRemoveGlobalAchievements(achievement: GlobalAchievement){
    achievement.earned = false;
    achievement.selectedOption = 0;
  }

  /**
   * Expects to be given a reference to an achievement found in this.achievements.globalAchievements.
   * We can use the referense directly (no lookup needed)
   */
  onChangeGlobalAchievementOption(achievement: GlobalAchievement, option: number){
    achievement.selectedOption = option;
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
