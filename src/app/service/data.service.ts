import { Injectable } from '@angular/core';
import { GoogleFileManagerService } from './google-file-manager.service';
import { Observable, merge, Subject, of, defer } from 'rxjs';
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
            map(({ action, file }) => ({ action, gloomFile: new GloomFile(file) })),
            filter(({ gloomFile }) => gloomFile.isGloomy)
        ).subscribe(({ action, gloomFile }) => {
            // We've subscribed to see loaded files where gloomFile.isGloomy is true.
            if (action === "load") {
                this.gloomFiles.push(gloomFile);
            } else if (action === "unload"){
                const i = this.gloomFiles.findIndex(gf => gf.id === gloomFile.id);
                if (i >= 0) {
                    this.gloomFiles = this.gloomFiles.splice(i, 1);
                } else {
                    // We shouldn't get here. Time for a reset
                    console.warn("Warning: data service and file manager out of sync. Correcting... ");
                    this.gloomFiles = Array.from(this.fileManager.currentDocuments.values()).map(val => new GloomFile(val));
                }
            }
            if(action === "load" || action === "unload"){
                const load = action === "load";
                this.gloomFileAlert$.next(load);
                if (gloomFile.isCampaign) this.campaignFileAlert$.next(load);
                if (gloomFile.isCharacter) this.characterFileAlert$.next(load);
            }
        });
    }

    listenGloomFiles(): Observable<GloomFile[]> {
        const currVal$ = defer(()=>of(this.getGloomFiles()));
        const newVal$ = this.gloomFileAlert$.pipe(map(()=>this.getGloomFiles()));
        return merge(currVal$, newVal$);
    }

    getGloomFiles(): GloomFile[] {
        return this.gloomFiles;
    }

    listenCharactersFiles(): Observable<CharacterFile[]> {
        const currVal$ = defer(()=>of(this.getCharacterFiles()));
        const newVal$ = this.characterFileAlert$.pipe(map(()=>this.getCharacterFiles()));
        return merge(currVal$, newVal$);
    }

    getCharacterFiles(): CharacterFile[] {
        return this.gloomFiles
            .filter(file => file.isCharacter)
            .map(charFile => new CharacterFile(charFile, false))
    }

    listenCampaignMinis(): Observable<CampaignMini[]> {
        const currVal$ = defer(()=>of(this.getCampaignMinis()));
        const newVal$ = this.campaignFileAlert$.pipe(map(()=>this.getCampaignMinis()));
        return merge(currVal$, newVal$);
    }

    getCampaignMinis(): CampaignMini[] {
        return this.gloomFiles
            .filter(file => file.isCampaign)
            .map(campFile => {
                const campaign = campFile.content.Campaign;
                const rtn = new CampaignMini(campFile.id, campaign.name);
                if (campaign.parties) {
                    rtn.parties = campaign.parties.filter(prty => prty.name && prty.name.length > 0).map(prty => prty.name);
                }
                return rtn;
            });
    }

    listenCharacterMinis(): Observable<CharacterMini[]> {
        const currVal$ = defer(()=>of(this.getCharacterMinis()));
        const newVal$ = this.characterFileAlert$.pipe(map(() => this.getCharacterMinis()));
        return merge(currVal$, newVal$);
    }

    getCharacterMinis(): CharacterMini[] {
        return this.gloomFiles
            .filter(file => file.isCharacter)
            .map(charFile => new CharacterMini(charFile.id, charFile.content.Character.name));
    }

    getCharacterFileByDocId(docId: string): CharacterFile {
        const i = this.gloomFiles.findIndex(info => info.id === docId);
        if (i >= 0 && this.gloomFiles[i].isCharacter) {
            return new CharacterFile(this.gloomFiles[i], false);
        }
        return null;
    }

    createNewCharacter(name: string, gclass: string): Observable<CharacterFile> {
        const char: Character = { name, class: gclass };
        return this.fileManager.createNewJsonFile(name, { Character: char }).pipe(
            map(jsonFile => new GloomFile(jsonFile)),
            map(gloomFile => new CharacterFile(gloomFile))
        );
    }
}
