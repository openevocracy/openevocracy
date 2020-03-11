import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material';
import { TranslateService, TranslateParser } from '@ngx-translate/core';

import { Observable } from 'rxjs';

//import 'rxjs/add/observable/fromArray';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/take';

@Injectable()
export class MatPaginatorI18nService extends MatPaginatorIntl {
	
	private rangeLabel1: string;
	private rangeLabel2: string;
	
	constructor(
		private translateService: TranslateService,
		private translateParser: TranslateParser
	) {
		super();  
		
		this.getAndInitTranslations();
	}
	
	/**
	 * @desc: Translates all strings, contained in paginator
	 */
	public getAndInitTranslations() {
		this.translateService.get([
			'PAGINATOR_ITEMS_PER_PAGE_LABEL',
			'PAGINATOR_NEXT_PAGE_LABEL',
			'PAGINATOR_PREVIOUS_PAGE_LABEL',
			'PAGINATOR_FIRST_PAGE_LABEL',
			'PAGINATOR_LAST_PAGE_LABEL',
			'PAGINATOR_RANGE_PAGE_LABEL_1',
			'PAGINATOR_RANGE_PAGE_LABEL_2'
		])
		.subscribe(translation => {
			this.itemsPerPageLabel = translation['PAGINATOR_ITEMS_PER_PAGE_LABEL'];
			this.nextPageLabel = translation['PAGINATOR_NEXT_PAGE_LABEL'];
			this.previousPageLabel = translation['PAGINATOR_PREVIOUS_PAGE_LABEL'];
			this.firstPageLabel = translation['PAGINATOR_FIRST_PAGE_LABEL'];
			this.lastPageLabel = translation['PAGINATOR_LAST_PAGE_LABEL'];
			this.rangeLabel1 = translation['PAGINATOR_RANGE_PAGE_LABEL_1'];
			this.rangeLabel2 = translation['PAGINATOR_RANGE_PAGE_LABEL_2'];
			this.changes.next();
		});
	}
	
	/**
	 * @desc: Overwrites getRangeLabel function from MatPaginatorIntl,
	 * 		 Use translateParser to fill missing values, direct translation is not possible,
	 * 		 since getRangeLabel expects a string as return value
	 * @source: https://medium.com/front-dev/translate-your-matpaginator-with-ngx-translate-and-stay-reactive-4c7b145cae9
	 */
	getRangeLabel = (page: number, pageSize: number, length: number) => {
		this.getAndInitTranslations();
		if (length === 0 || pageSize === 0)
			return this.translateParser.interpolate(this.rangeLabel1, { length });
		
		length = Math.max(length, 0);
		const startIndex = page * pageSize;
		const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
		return this.translateParser.interpolate(this.rangeLabel2, { startIndex: startIndex + 1, endIndex, length });
	}
}
