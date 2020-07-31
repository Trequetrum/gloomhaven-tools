import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
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

  displayedColumns: string[] = ['Name', 'Inferred Type', 'Can Edit', 'Load/Unload'];
  dataSource: MatTableDataSource<JsonFile>;

  helloString = "hello";

  constructor(
    public oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService, 
    private googleFileLoader: GoogleFileManagerService){}

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild( MatTable ) table: MatTable<JsonFile>;

  hello(file: JsonFile): string{
    console.log("file.name: ", file.name );
    return "Hi ";
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource<JsonFile>();
    this.dataSource.sort = this.sort;
    this.googleFileLoader.listenLoadedFiles().subscribe(()=>{
      this.dataSource.data = Array.from(this.googleFileLoader.currentDocuments.values());
      console.log("this.dataSource.data: ", this.dataSource.data);
      console.log("file0.name: ", this.dataSource.data[0].name);
      this.table.renderRows();
    })
  }

  logIn(){
    this.oauthService.getUserName().subscribe();
  }

  loadGooglePicker(){
    this.googlePicker.showGloomtoolsGooglePicker();
  }

}
