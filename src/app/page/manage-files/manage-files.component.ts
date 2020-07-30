import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleFileManagerService } from 'src/app/service/google-file-manager.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';


@Component({
  selector: 'app-manage-files',
  templateUrl: './manage-files.component.html',
  styleUrls: ['./manage-files.component.scss']
})
export class ManageFilesComponent implements OnInit {

  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = new MatTableDataSource();

  constructor(
    public oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService, 
    private googleFileLoader: GoogleFileManagerService){}

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.googleFileLoader.getAllAccessibleFiles()
    this.dataSource.data 
  }

  logIn(){
    this.oauthService.getUserName().subscribe();
  }

  loadGooglePicker(){
    this.googlePicker.showGloomtoolsGooglePicker();
  }

}
