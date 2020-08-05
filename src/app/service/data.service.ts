import { Injectable } from '@angular/core';
import { GoogleFileManagerService } from './google-file-manager.service';
import { Observable, BehaviorSubject, merge } from 'rxjs';
import { GloomFile } from '../model_data/gloom-file';
import { map } from 'rxjs/operators';
import { CampaignMini } from '../model_data/campaign-mini';
import { PartyMini } from '../model_data/party-mini';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private gloomFiles = new Array<GloomFile>();

  constructor(private fileManager: GoogleFileManagerService) {
    fileManager.listenLoadedFiles().subscribe(()=>{
      this.gloomFiles = Array.from(this.fileManager.currentDocuments.values()).map(val => new GloomFile(val));
      this.gloomFiles$.next(this.gloomFiles);
    });
  }

  private gloomFiles$ = new BehaviorSubject<GloomFile[]>(new Array<GloomFile>());
  listenForFiles(): Observable<GloomFile[]>{
    return this.gloomFiles$.asObservable();
  }

  private campaignParty$ = new BehaviorSubject<CampaignMini[]>(this.getCampaignMinis());
  listenCampaignMinis(): Observable<CampaignMini[]>{
    const fromNewfile$ = this.listenForFiles().pipe(map(this.filterCampaignMinis));
    return merge(this.campaignParty$.asObservable(), fromNewfile$);
  }

  getCampaignMinis() : CampaignMini[]{
    return this.filterCampaignMinis(this.gloomFiles);
  }

  filterCampaignMinis(gloomFiles: GloomFile[]): CampaignMini[]{
    return gloomFiles
      .filter(info => info.isCampaign)
      .map(campInfo => {
        const campaign = campInfo.file.getContent().Campaign;
        if(campaign.name){
          const rtn = new CampaignMini(campInfo.file.id, campaign.name);
          if(campaign.parties){
            campaign.parties.forEach(val => {
              if(val.name) rtn.parties.push(val.name);
            });
          }
          return rtn;
        }
        return null;
      })
      .filter(camp => camp? true:false);
  }

}
