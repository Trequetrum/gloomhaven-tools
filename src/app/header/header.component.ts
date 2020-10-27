import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InputInitiativeComponent } from '../dialog/input-initiative/input-initiative.component';
import { MenuDisplayItem } from '../model_ui/menu-display-item';
import { CampaignMini } from '../model_data/campaign-mini';
import { PartyMini } from '../model_data/party-mini';
import { DataService } from '../service/data.service';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { CharacterMini } from '../model_data/character-mini';
import { GoogleOauth2Service } from '../service/google-service/google-oauth2.service';


@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

	campaignMinis$: Observable<CampaignMini[]>;
	characterMinis$: Observable<CharacterMini[]>;

	constructor(
		public dialog: MatDialog,
		public authService: GoogleOauth2Service,
		public data: DataService
	) { }

	ngOnInit(): void {
		// Try to authenticate the user they have a currently active google session and it's signed into this app
		this.authService.getUserName().subscribe();

		// Get campaign minis. Filter out results that don't have any parties. We don't need to show those in the header.
		this.campaignMinis$ = this.data.listenCampaignMinis().pipe(map(minis => minis.filter(mini => mini.parties.length > 0)));
		// get charater minis. If we want to limit which characters are displayed in the header, this is the place to do it
		this.characterMinis$ = this.data.listenCharacterMinis();
	}

	signIn(): void {
		this.authService.getUserName().subscribe();
	}

	signOut(): void {
		this.authService.signOut();
	}

	openInitiativeDialog(): void {
		const dialogRef = this.dialog.open(InputInitiativeComponent);
		dialogRef.afterClosed().subscribe(result => {
			console.log(`TODO: EMIT initiative=${result}`);
		})
	}

	onPartyClick(party: any) {

		if (party instanceof PartyMini) {
			console.log(`TODO: Something about clicking party: ${party.name}`);
		} else {
			console.log(`onPartyClick() without PartyMini Object: ${party}`);
		}
	}

	encodeURItst(val: string) {
		return encodeURI(val);
	}
}