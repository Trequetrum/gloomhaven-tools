import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InputInitiativeComponent } from '../dialog/input-initiative/input-initiative.component';
import { MenuDisplayItem } from '../model_ui/menu-display-item';
import { CampaignMini } from '../model_data/campaign-mini';
import { PartyMini } from '../model_data/party-mini';
import { GoogleOauth2Service } from '../service/google-oauth2.service';
import { DataService } from '../service/data.service';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  campaignMinis: CampaignMini[];
  charDisplayList: MenuDisplayItem[];

  constructor(
    public dialog: MatDialog, 
    public authService: GoogleOauth2Service,
    private data: DataService
  ) {
    this.charDisplayList = new Array();
    this.charDisplayList.push(new MenuDisplayItem("Character1", false));
    this.charDisplayList.push(new MenuDisplayItem("Character2", false));
    this.charDisplayList.push(new MenuDisplayItem("JoeBob", false));
  }

  ngOnInit(): void {
    this.data.listenCampaignMinis().subscribe(minis => this.campaignMinis = minis);
  }

  login(): void {
    this.authService.getUserName().subscribe();
  }

  openInitiativeDialog(): void {
    const dialogRef = this.dialog.open(InputInitiativeComponent);
    dialogRef.afterClosed().subscribe(result => {
        console.log(`TODO: EMIT initiative=${result}`);
    })
  }

  onPartyClick(party :any){
    if(party instanceof PartyMini){
      console.log(`TODO: Something about clicking party: ${party.name}`);
    }else{
      console.log(`onPartyClick() without PartyMini Object: ${party}`);
    }
  }
}