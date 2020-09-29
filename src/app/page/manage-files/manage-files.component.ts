import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleFileManagerService } from 'src/app/service/google-file-manager.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { map, tap, take, mergeMap } from 'rxjs/operators';
import { JsonFile } from 'src/app/model_data/json-file';
import { GloomFile } from 'src/app/model_data/gloom-file';
import { interval } from 'rxjs';

@Component({
	selector: 'app-manage-files',
	templateUrl: './manage-files.component.html',
	styleUrls: ['./manage-files.component.scss']
})
export class ManageFilesComponent implements OnInit, AfterViewInit {

	displayedColumns: string[] = ['name', 'edit', 'type', 'loaded', 'sync'];
	dataSource = new MatTableDataSource();

	@ViewChild(MatSort, { static: true }) sort: MatSort;
	@ViewChild(MatTable, { static: false }) table: MatTable<any>;

	constructor(
		public oauthService: GoogleOauth2Service,
		private googlePicker: GooglePickerService,
		private fileManager: GoogleFileManagerService) { }

	ngOnInit() {

		// We get our files from the filemanager because the data service throws away any files 
		// it doesn't need. Files that don't parse or don't contain gloomhaven data are quietly 
		// ignored. Here, however, we want access to all the files. If only as a way to 
		// show/explain parsing errors to the user.
		this.fileManager.listenDocuments().pipe(
			map(files => files.map(file => new GloomFile(file)))
		).subscribe(gloomfiles => {
			this.dataSource.data = gloomfiles;
		});
	}

	ngAfterViewInit() {
		// Set Sort
		this.dataSource.sort = this.sort;

		this.dataSource.sortingDataAccessor = (file: GloomFile, columnDef: string) => {
			switch (columnDef) {
				case 'name': return file.name.toLowerCase();
				case 'edit': return file.canEdit ? 0 : 1;
				case 'type': return file.type.toLowerCase();
				case 'sync': return 0;
				case 'loaded': return 0;
				default: return file[columnDef];
			}
		};
	}

	renderTableRows() {
		// This line really should work, but I just CAN NOT figure it out.
		// this.table.renderRows();

		// The work around is to create a shallow copy of the array and trigger re-rendering that way
		this.dataSource.data = this.dataSource.data.slice();
	}

	load(load: boolean, file: GloomFile) {
		if (load)
			console.log("Load " + file.name);
		else
			console.log("unload " + file.name);
	}

	updateDataSourcetst() {
		this.dataSource.data.push(new GloomFile(new JsonFile("ID", "Tahomas", false, "Bleh")));
		this.renderTableRows();
	}

	logIn() {
		this.oauthService.getUserName().subscribe();
	}

	loadGooglePicker() {
		this.googlePicker.showGloomtoolsGooglePicker().subscribe();
	}

	logDate() {
		console.log(new Date().toString());
	}

}
