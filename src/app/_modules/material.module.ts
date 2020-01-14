import { NgModule } from '@angular/core';

import { MatPaginatorI18nService } from '../_services/mat-paginator-i18n.service';

import {
	MatButtonModule,
	MatFormFieldModule,
	MatInputModule,
	MatToolbarModule,
	MatListModule,
	MatMenuModule,
	MatGridListModule,
	MatCardModule,
	MatTooltipModule,
	MatRippleModule,
	MatTabsModule,
	MatSnackBarModule,
	MatDialogModule,
	MatSlideToggleModule,
	MatSelectModule,
	MatBadgeModule,
	MatCheckboxModule,
	MatExpansionModule,
	MatPaginatorModule,
	MatPaginatorIntl
} from '@angular/material';

@NgModule({
	imports: [
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatToolbarModule,
		MatListModule,
		MatMenuModule,
		MatGridListModule,
		MatCardModule,
		MatTooltipModule,
		MatRippleModule,
		MatTabsModule,
		MatSnackBarModule,
		MatDialogModule,
		MatSlideToggleModule,
		MatSelectModule,
		MatBadgeModule,
		MatCheckboxModule,
		MatExpansionModule,
		MatPaginatorModule
	],
	exports: [
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatToolbarModule,
		MatListModule,
		MatMenuModule,
		MatGridListModule,
		MatCardModule,
		MatTooltipModule,
		MatRippleModule,
		MatTabsModule,
		MatSnackBarModule,
		MatDialogModule,
		MatSlideToggleModule,
		MatSelectModule,
		MatBadgeModule,
		MatCheckboxModule,
		MatExpansionModule,
		MatPaginatorModule
	],
	providers: [
		{ provide: MatPaginatorIntl, useClass: MatPaginatorI18nService }
	],
	entryComponents: [
		
	]
})
export class MaterialModule {}
