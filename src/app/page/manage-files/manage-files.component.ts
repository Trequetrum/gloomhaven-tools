import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleFileManagerService } from 'src/app/service/google-file-manager.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { JsonFile } from 'src/app/model_data/json-file';
import { DataService } from 'src/app/service/data.service';
import { GloomFile } from 'src/app/model_data/gloom-file';

@Component({
  selector: 'app-manage-files',
  templateUrl: './manage-files.component.html',
  styleUrls: ['./manage-files.component.scss']
})
export class ManageFilesComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['name', 'edit', 'type', 'loaded', 'sync'];
  dataSource = new MatTableDataSource();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatTable, {static:false}) table: MatTable<any>;

  constructor(
    public oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService,
    private data: DataService,
    private googleFileLoader: GoogleFileManagerService){}

  ngOnInit() {
    // Listen for file changes
    this.data.listenForFiles().subscribe(files => this.dataSource.data = files);
  }

  ngAfterViewInit(){
    // Set Sort
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (info: GloomFile, columnDef: string) => {
      switch (columnDef) {
        case 'name': return info.file.name.toLowerCase();
        case 'edit': return info.file.canEdit? 0 : 1;
        case 'type': return info.type.toLowerCase();
        case 'sync': return 0;
        case 'loaded': return 0;
        default: return info[columnDef];
      }
    };
  }

  renderTableRows(){
    // This line really should work, but I just CAN NOT figure it out.
    // this.table.renderRows();

    // The work around is to create a shallow copy of the array and trigger re-rendering that way
    this.dataSource.data = this.dataSource.data.slice();
  }

  load(load: boolean, info: GloomFile){
    console.log(info.file.getContent())
    if(load)
      console.log("Load " + info.file.name);
    else
      console.log("unload " + info.file.name);
  }
  
  updateDataSourcetst(){
    this.dataSource.data.push(new GloomFile(new JsonFile("ID", "Tahomas", false, "Bleh")));
    this.renderTableRows();
  }

  logIn(){
    this.oauthService.getUserName().subscribe();
  }

  loadGooglePicker(){
    this.googlePicker.showGloomtoolsGooglePicker();
  }

  logDate(){
    console.log(new Date().toString());
  }

}
