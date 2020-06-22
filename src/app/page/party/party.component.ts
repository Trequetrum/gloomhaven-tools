import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { DataMemoryService } from 'src/app/service/data-memory.service';
import { Campaign } from 'src/app/model_data/campaign';
import { Party } from 'src/app/model_data/party';

import { MatDialog } from '@angular/material/dialog';
import { SelectChiplistDialogComponent } from 'src/app/dialog/select-chiplist-dialog/select-chiplist-dialog.component';
import { ChipMenuData, ChipMenuItem, ChipSubmenuItem } from 'src/app/model_ui/chip-menu-data';
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

  globalAchievementsModel: ChipMenuData;

  readonly GLOBAL_ACHIEVEMENTS = 0;
  viewSelect = new Array<boolean>(1);

  constructor(
    private route: ActivatedRoute, 
    private data: DataMemoryService,
    public dialog: MatDialog,
    public achievements: AchievementsService) {
      /* Wrap the achievements so that we can model the opening and closing of menus.
        This does mean that we use references to the achievments and not the array directly.
        Altering the array in AchievementsService won't be reflected here, but 
        altering the achievements within the array still should be.
        
        I'm not sure if this is the most desirable behaviour. It's not super encapsulated.
        We can re-wrap and/or copy-wrap if needed.
        
        This way, though, changing the achievements for a newly selected campaign/party is
        simple.
        */
      this.globalAchievementsModel = this.wrapGlobalAchievements(this.achievements.globalAchievements);
      for (let item of this.globalAchievementsModel.chipMenuItems){
        item.text
      }
    }

  ngOnInit(): void {
    this.route.queryParams.subscribe(
      params => this.onQueryParamChange(params)
    );
  }
  
  /**
   * Params sent in give us a party id. We can use that to grab the relevant campaign
   * and display all the needed information.
   * @param params 
   */
  onQueryParamChange(params: Params){
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

  wrapGlobalAchievements(globList: Array<GlobalAchievement>): ChipMenuData{
    let result = new ChipMenuData("Global Achievements Earned");
    
    for(let globAcheiv of globList){
    
      let chipItm = new ChipMenuItem(globAcheiv.name, globAcheiv);
      if(globAcheiv.options){
        for(let index in globAcheiv.options){
          chipItm.subMenu.push(new ChipSubmenuItem(`: ${globAcheiv.options[index]}`, {achievement: globAcheiv, selected: index}));
        }
      }
      result.chipMenuItems.push(chipItm);
    }

    return result;
  }

  onAddGlobalAchievements(){
    /* Collect all unearned achievements and send them to the dialog */
    let injectData = new ChipMenuData("Global Achievements", "Select");

    for(let chipMenuItem of this.globalAchievementsModel.chipMenuItems){
      if(chipMenuItem.data instanceof GlobalAchievement){
        if(!chipMenuItem.data.earned){
          // Note that this isn't a copy of chipMenuItem, so any state changes
          // created by the dialog are reflected here.
          injectData.chipMenuItems.push(chipMenuItem);
        }
      }
    }
    let dialogRef = this.dialog.open(SelectChiplistDialogComponent, {data: injectData});

    // Wait on result and deal with any newly earned achievements
    dialogRef.afterClosed().subscribe(result => {
      console.log("result:", result);

      // We're sharing a model with the dialog that just closed, so expanded items
      // in the dialog will be expanded here. We don't want that, so instead of 
      // separating the models, we just close the menus
      for(let chipMenuItem of this.globalAchievementsModel.chipMenuItems){
        chipMenuItem.expanded = false;
      }

      // If there's no result, don't panic, that's just fine
      if(result){
        if(result instanceof GlobalAchievement){
          result.earned = true;
        }else if(result.achievement instanceof GlobalAchievement){
          result.achievement.earned = true;
          result.achievement.selectedOption = result.selected;
        }else{
          // If there's a result, it shouldn't make it here.
          const error = "Unrecognised result from dialogRef.afterClosed() in PartyComponent.onAddGlobalAchievements()";
          console.log(error);
          throw new Error(error);
        }
      }
    });
  }

  onRemoveGlobalAchievements(achievement: GlobalAchievement){
    // Unearned achievements arn't displayed. Looks like a 'delete' to the user.
    achievement.earned = false;
    // We don't need this, but returns the selected option to the default state which
    // will make it easier to debug if something ever goes awry 
    achievement.selectedOption = 0;
  }

  onChipClick(item: ChipMenuItem){
    // Toggle expanded on the menu if there's a submenu, otherwise do nothing. 
    if(item.subMenu.length > 0){
      item.expanded = !item.expanded
    }
  }

  onSubChipClick(item:ChipMenuItem, subItem: ChipSubmenuItem){
    // Clicking an option in a submenu, closes the menu.
    this.onChipClick(item);
    // Reflect the user's choice in the model (globalAchievementsModel).
    if(subItem.data){
      if(subItem.data.selected){
        subItem.data.achievement.selectedOption = subItem.data.selected;
      }
    }
  }

  setSingleView(view: number){
    // Clear all views (set them false)
    for(let i in this.viewSelect){
      this.viewSelect[i] = false;
    }
    // Set the view we've been passed in
    if (view < this.viewSelect.length) {
      this.viewSelect[view] = true;
    }
  }
}
