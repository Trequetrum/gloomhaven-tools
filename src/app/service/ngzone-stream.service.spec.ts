import { TestBed } from '@angular/core/testing';

import { NgZoneStreamService } from './ngzone-stream.service';

describe('NgZoneStreamService', () => {
	let service: NgZoneStreamService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(NgZoneStreamService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
