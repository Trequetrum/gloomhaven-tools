import { Injectable } from '@angular/core';
import { GoogleFileManagerService } from './google-file-manager.service';
import { Observable, BehaviorSubject, merge, Subject, of } from 'rxjs';
import { GloomFile } from '../model_data/gloom-file';
import { map } from 'rxjs/operators';
import { CampaignMini } from '../model_data/campaign-mini';
import { CharacterMini } from '../model_data/character-mini';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private characterFileAlert$ = new Subject<boolean>();
  private campaignFileAlert$ = new Subject<boolean>();
  
  private gloomFiles = new Array<GloomFile>();
  private gloomFiles$ = new BehaviorSubject<GloomFile[]>(new Array<GloomFile>());

  constructor(private fileManager: GoogleFileManagerService) {

    this.gloomFiles = Array.from(this.fileManager.currentDocuments.values()).map(val => new GloomFile(val));

    fileManager.listenLoadedFiles().subscribe(({load, file}) => {
      const newGloomFile = new GloomFile(file);

      if(load){
        this.gloomFiles.push(newGloomFile);
        this.gloomFiles$.next(this.gloomFiles);
      }else{
        const i = this.gloomFiles.findIndex(gf => gf.file.id === file.id);
        if(i >= 0){ 
          this.gloomFiles = this.gloomFiles.splice(i, 1);
          this.gloomFiles$.next(this.gloomFiles);
        }else{
          // We shouldn't get here. Time for a reset
          console.warn("Warning: data service and file manager out of sync. Correcting... ");
          this.gloomFiles = Array.from(this.fileManager.currentDocuments.values()).map(val => new GloomFile(val));
          this.gloomFiles$.next(this.gloomFiles);
        }
      }

      if(newGloomFile.isCampaign) this.campaignFileAlert$.next(load);
      if(newGloomFile.isCharacter) this.characterFileAlert$.next(load);

    });
  }

  listenForFiles(): Observable<GloomFile[]>{
    return this.gloomFiles$.asObservable();
  }

  listenCampaignMinis(): Observable<CampaignMini[]>{
    return merge(of(this.getCampaignMinis()), this.campaignFileAlert$.pipe(map(() => this.getCampaignMinis())));
  }

  getCampaignMinis() : CampaignMini[]{
    return this.gloomFiles
      .filter(info => info.isCampaign && info.file.getContent().Campaign.name && info.file.getContent().Campaign.name.length > 0)
      .map(campInfo => {
        const campaign = campInfo.file.getContent().Campaign;
        const rtn = new CampaignMini(campInfo.file.id, campaign.name);
        if(campaign.parties){
          rtn.parties = campaign.parties.filter(prty => prty.name && prty.name.length > 0).map(prty => prty.name);
        }
        return rtn;
      });
  }

  listenCharacterMinis(): Observable<CharacterMini[]>{
    return merge(of(this.getCharacterMinis()), this.characterFileAlert$.pipe(map(() => this.getCharacterMinis())));
  }

  getCharacterMinis(): CharacterMini[]{
    return this.gloomFiles
      .filter(info => info.isCharacter && info.file.getContent().Character.name && info.file.getContent().Character.name.length > 0)
      .map(charInfo => new CharacterMini(charInfo.file.id, charInfo.file.getContent().Character.name));
  }

  getCharacterByDocId(docId: string): GloomFile {
    const i = this.gloomFiles.findIndex(info => info.file.id === docId);
    if(i >= 0) return this.gloomFiles[i];
    return null;
  }
}
