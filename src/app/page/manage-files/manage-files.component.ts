import { Component, OnInit, AfterViewInit, ViewChild, NgZone, SystemJsNgModuleLoader } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleFileManagerService } from 'src/app/service/google-file-manager.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { JsonFile } from 'src/app/model_data/json-file';

@Component({
  selector: 'app-manage-files',
  templateUrl: './manage-files.component.html',
  styleUrls: ['./manage-files.component.scss']
})
export class ManageFilesComponent implements OnInit {

  displayedColumns: string[] = ['name', 'edit', 'type', 'loaded'];
  dataSource: JsonFile[] = [];

  constructor(
    public oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService, 
    private googleFileLoader: GoogleFileManagerService){}


  ngOnInit() {
    
  }

  boop(){
    console.log("Boop!");
  }

  updateDataSource() {
    this.dataSource = Array.from(this.googleFileLoader.currentDocuments.values());
  }

  logIn(){
    this.oauthService.getUserName().subscribe();
  }

  loadGooglePicker(){
    this.googlePicker.showGloomtoolsGooglePicker();
  }

  inferType(file: JsonFile): string{
    if(file.content.Campaign) return "Campaign";
    if(file.content.Character) return "Character";
    return "Unknown";
  }

}
