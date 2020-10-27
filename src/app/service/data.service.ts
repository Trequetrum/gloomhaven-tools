import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GloomFile } from '../model_data/gloom-file';
import { map, filter, tap, scan, debounceTime, mapTo } from 'rxjs/operators';
import { CampaignMini } from '../model_data/campaign-mini';
import { CharacterMini } from '../model_data/character-mini';
import { Character } from '../json_interfaces/character';
import { CharacterFile } from '../model_data/character-file';
import { CampaignFile } from '../model_data/campaign-file';
import { JsonFile } from '../model_data/json-file';
import { ClassDataService } from './json-service/class-data.service';
import { GoogleFileManagerService, FileAlertAction } from './google-service/google-file-manager.service';
import { StubFileManagerService } from './stub-service/stub-file-manager.service';

@Injectable({
	providedIn: 'root',
})
export class DataService {

	constructor(private fileManager: StubFileManagerService, private classData: ClassDataService) { }

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

	listenGloomFileCache(): Observable<GloomFile[]> {
		return this.fileManager.listenDocuments().pipe(
			map(
				(docs: JsonFile[]) => docs
					.map(doc => new GloomFile(doc))
					.filter(gloomFile => gloomFile.isGloomy)
			)
		);
	}

	listenCharacterFileCache(): Observable<CharacterFile[]> {
		return this.listenGloomFileCache().pipe(
			map((gloomfiles: GloomFile[]) =>
				gloomfiles
					.filter(file => file.isCharacter)
					.map(file => new CharacterFile(file))
			)
		);
	}

	listenCampaignFileCache(): Observable<CampaignFile[]> {
		return this.listenGloomFileCache().pipe(
			map((gloomfiles: GloomFile[]) =>
				gloomfiles
					.filter(file => file.isCampaign)
					.map(file => new CampaignFile(file))
			)
		);
	}

	listenCharacterMinis(): Observable<CharacterMini[]> {
		return this.listenCharacterFileCache().pipe(
			// Debounce since we're only interested in the freshest values
			// Stops stuttering on load
			debounceTime(250),
			map((charFiles: CharacterFile[]) =>
				charFiles.map(file => new CharacterMini(file.id, file.content.Character.name))
			)
		);
	}

	listenCampaignMinis(): Observable<CampaignMini[]> {
		return this.listenCampaignFileCache().pipe(
			// Debounce since we're only interested in the freshest values
			// Stops stuttering on load
			debounceTime(250),
			map((campFiles: CampaignFile[]) =>
				campFiles.map(file => {
					const campaign = file.content.Campaign;
					const rtn = new CampaignMini(file.id, campaign.name);
					if (campaign.parties) {
						rtn.parties = campaign.parties
							.filter(prty => prty.name && prty.name.length > 0)
							.map(prty => prty.name);
					}
					return rtn;
				})
			)
		);
	}

	listenGloomFileByDocId(docId: string): Observable<{ action: FileAlertAction; file: GloomFile }> {
		return this.fileManager.listenDocumentById(docId).pipe(
			map(({ action, file: jsonFile }) => ({
				action,
				file: new GloomFile(jsonFile),
			})),
		);
	}

	listenCharacterFileByDocId(docId: string): Observable<{ action: FileAlertAction; file: CharacterFile }> {
		return this.listenGloomFileByDocId(docId).pipe(
			map(({ action, file: GloomFile }) => ({
				action,
				file: new CharacterFile(GloomFile),
			}))
		);
	}

	listenCampaignFileByDocId(docId: string): Observable<{ action: FileAlertAction; file: CampaignFile }> {
		return this.listenGloomFileByDocId(docId).pipe(
			map(({ action, file: GloomFile }) => ({
				action,
				file: new CampaignFile(GloomFile),
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
		return this.fileManager.saveJsonFile(file).pipe(mapTo(true));
	}
}
