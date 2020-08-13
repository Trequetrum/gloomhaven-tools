import { Injectable } from '@angular/core';
import { GoogleFileManagerService } from './google-file-manager.service';
import { Observable, merge, Subject, of } from 'rxjs';
import { GloomFile } from '../model_data/gloom-file';
import { map, filter } from 'rxjs/operators';
import { CampaignMini } from '../model_data/campaign-mini';
import { CharacterMini } from '../model_data/character-mini';
import { Character } from '../json_interfaces/character';
import { CharacterFile } from '../model_data/character-file';

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private gloomFileAlert$ = new Subject<boolean>();
    private characterFileAlert$ = new Subject<boolean>();
    private campaignFileAlert$ = new Subject<boolean>();

    private gloomFiles = new Array<GloomFile>();

    constructor(private fileManager: GoogleFileManagerService) {

        this.gloomFiles = Array.from(this.fileManager.currentDocuments.values()).map(val => new GloomFile(val)).filter(file => file.isGloomy);

        fileManager.listenDocumentLoad().pipe(
            map(({ load, file }) => ({ load, gloomFile: new GloomFile(file) })),
            filter(({ gloomFile }) => gloomFile.isGloomy)
        ).subscribe(({ load, gloomFile }) => {
            // We've subscribed to see loaded files where gloomFile.isGloomy is true.
            if (load) {
                this.gloomFiles.push(gloomFile);
            } else {
                const i = this.gloomFiles.findIndex(gf => gf.file.id === gloomFile.file.id);
                if (i >= 0) {
                    this.gloomFiles = this.gloomFiles.splice(i, 1);
                } else {
                    // We shouldn't get here. Time for a reset
                    console.warn("Warning: data service and file manager out of sync. Correcting... ");
                    this.gloomFiles = Array.from(this.fileManager.currentDocuments.values()).map(val => new GloomFile(val));
                }
            }

            this.gloomFileAlert$.next(load);
            if (gloomFile.isCampaign) this.campaignFileAlert$.next(load);
            if (gloomFile.isCharacter) this.characterFileAlert$.next(load);
        });
    }

    listenGloomFiles(): Observable<GloomFile[]> {
        return merge(of(this.getGloomFiles()), this.gloomFileAlert$.pipe(map(()=>this.getGloomFiles())));
    }

    getGloomFiles(): GloomFile[] {
        return this.gloomFiles;
    }

    listenCharactersFiles(): Observable<CharacterFile[]> {
        return merge(of(this.getCharacterFiles()), this.characterFileAlert$.pipe(map(()=>this.getCharacterFiles())));
    }

    getCharacterFiles(): CharacterFile[] {
        return this.gloomFiles
            .filter(info => info.isCharacter)
            .map(infoChar => new CharacterFile(infoChar.file, false))
    }

    listenCampaignMinis(): Observable<CampaignMini[]> {
        return merge(of(this.getCampaignMinis()), this.campaignFileAlert$.pipe(map(()=>this.getCampaignMinis())));
    }

    getCampaignMinis(): CampaignMini[] {
        return this.gloomFiles
            .filter(info => info.isCampaign)
            .map(campInfo => {
                const campaign = campInfo.file.content.Campaign;
                const rtn = new CampaignMini(campInfo.file.id, campaign.name);
                if (campaign.parties) {
                    rtn.parties = campaign.parties.filter(prty => prty.name && prty.name.length > 0).map(prty => prty.name);
                }
                return rtn;
            });
    }

    listenCharacterMinis(): Observable<CharacterMini[]> {
        return merge(of(this.getCharacterMinis()), this.characterFileAlert$.pipe(map(() => this.getCharacterMinis())));
    }

    getCharacterMinis(): CharacterMini[] {
        return this.gloomFiles
            .filter(info => info.isCharacter)
            .map(charInfo => new CharacterMini(charInfo.file.id, charInfo.file.content.Character.name));
    }

    getCharacterFileByDocId(docId: string): CharacterFile {
        const i = this.gloomFiles.findIndex(info => info.file.id === docId);
        if (i >= 0 && this.gloomFiles[i].isCharacter) {
            return new CharacterFile(this.gloomFiles[i].file, false);
        }
        return null;
    }

    createNewCharacter(name: string, gclass: string): Observable<CharacterFile> {
        const char: Character = { name, class: gclass };
        return this.fileManager.createNewJsonFile(name, { Character: char }).pipe(
            map(jsonFile => new CharacterFile(jsonFile))
        );
    }
}
