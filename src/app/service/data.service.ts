import { Injectable } from '@angular/core';
import { GoogleFileManagerService, FileAlertAction } from './google-file-manager.service';
import { Observable } from 'rxjs';
import { GloomFile } from '../model_data/gloom-file';
import { map, filter, tap, scan, debounceTime } from 'rxjs/operators';
import { CampaignMini } from '../model_data/campaign-mini';
import { CharacterMini } from '../model_data/character-mini';
import { Character } from '../json_interfaces/character';
import { CharacterFile } from '../model_data/character-file';
import { ClassDataService } from './class-data.service';
import { CampaignFile } from '../model_data/campaign-file';

@Injectable({
	providedIn: 'root',
})
export class DataService {

	constructor(private fileManager: GoogleFileManagerService, private classData: ClassDataService) { }

	listenGloomFileAction(): Observable<{
		action: FileAlertAction,
		gloomFile: GloomFile
	}> {
		return this.fileManager.listenDocumentLoad().pipe(
			map(({ action, file }) => ({ action, gloomFile: new GloomFile(file) })),
			filter(({ gloomFile }) => gloomFile.isGloomy)
		);
	}

	listenGloomCharacterFileAction(): Observable<{
		action: FileAlertAction,
		characterFile: CharacterFile
	}> {
		return this.listenGloomFileAction().pipe(
			filter(({ gloomFile }) => gloomFile.isCharacter),
			map(({ action, gloomFile }) => ({ action, characterFile: new CharacterFile(gloomFile) }))
		);
	}

	listenGloomCampaignFileAction(): Observable<{
		action: FileAlertAction,
		campaignFile: CampaignFile
	}> {
		return this.listenGloomFileAction().pipe(
			filter(({ gloomFile }) => gloomFile.isCampaign),
			map(({ action, gloomFile }) => ({ action, campaignFile: new CampaignFile(gloomFile) }))
		);
	}

	listenCharacterMinis(): Observable<CharacterMini[]> {
		// Accumulate CharacterMinis in a Map
		const accumulator = (accMap: Map<string, CharacterMini>, { action, characterMini }) => {
			if (action === "load" || action === "update" || action === "save") {
				accMap.set(characterMini.docId, characterMini);
			} else if (action === "unload" || action === "error") {
				accMap.delete(characterMini.docId);
			} else {
				console.error("listenCharacterMinis() Ignoring unrecognised action: " + action);
			}
			return accMap;
		}

		return this.listenGloomCharacterFileAction().pipe(
			// Convert CharacterFile to CharacterMini
			map(({ action, characterFile: cf }) =>
				({
					action,
					characterMini: new CharacterMini(cf.id, cf.content.Character.name)
				})
			),
			// Accumulate CharacterMinis
			scan(accumulator, new Map<string, CharacterMini>()),
			// Convert accumulated CharacterMinis to array and emit
			map(accMap => Array.from(accMap.values())),
			// Debounce since we're only interested in the freshest values
			// Stops stuttering on load
			debounceTime(250)
		);
	}

	listenCampaignMinis(): Observable<CampaignMini[]> {
		// Accumulate CampaignMini in a Map
		const accumulator = (accMap: Map<string, CampaignMini>, { action, campaignMini }) => {
			if (action === "load" || action === "update" || action === "save") {
				accMap.set(campaignMini.docId, campaignMini);
			} else if (action === "unload" || action === "error") {
				accMap.delete(campaignMini.docId);
			} else {
				console.error("listenCampaignMini() Ignoring unrecognised action: " + action);
			}
			return accMap;
		}

		return this.listenGloomCampaignFileAction().pipe(
			// Convert CampaignFile to CampaignMini
			map(({ action, campaignFile: cf }) => {
				const campaign = cf.content.Campaign;
				const rtn = new CampaignMini(cf.id, campaign.name);
				if (campaign.parties) {
					rtn.parties = campaign.parties
						.filter(prty => prty.name && prty.name.length > 0)
						.map(prty => prty.name);
				}
				return { action, campaignMini: rtn };
			}),
			// Accumulate CampaignMini
			scan(accumulator, new Map<string, CampaignMini>()),
			// Convert accumulated CharacterMinis to array and emit
			map(accMap => Array.from(accMap.values())),
			// Debounce since we're only interested in the freshest values
			// Stops stuttering on load
			debounceTime(250)
		);
	}

	listenCharacterFileByDocId(docId: string): Observable<{ action: FileAlertAction; file: CharacterFile }> {
		return this.fileManager.listenDocumentById(docId).pipe(
			map(({ action, file: jsonFile }) => ({
				action,
				file: new GloomFile(jsonFile),
			})),
			map(({ action, file: GloomFile }) => ({
				action,
				file: new CharacterFile(GloomFile),
			}))
		);
	}

	createNewCharacter(name: string, gclass: string, level: number): Observable<CharacterFile> {
		const gold = this.classData.convertLevelToGold(level);
		const experience = this.classData.convertLevelToExp(level);

		const char: Character = { name, class: gclass, level, gold, experience };
		return this.fileManager.createAndSaveNewJsonFile(name, { Character: char }).pipe(
			map(jsonFile => new GloomFile(jsonFile)),
			map(gloomFile => new CharacterFile(gloomFile))
		);
	}

	saveFile(file: GloomFile): Observable<boolean> {
		return this.fileManager.saveJsonFile(file).pipe(map(_ => true));
	}
}
