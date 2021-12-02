import { NgModule } from '@angular/core';

import { MatPaginatorI18nService } from '../_services/mat-paginator-i18n.service';

import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

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
		MatRadioModule,
		MatExpansionModule,
		MatProgressBarModule,
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
		MatRadioModule,
		MatExpansionModule,
		MatProgressBarModule,
		MatPaginatorModule
	],
	providers: [
		{ provide: MatPaginatorIntl, useClass: MatPaginatorI18nService }
	],
	entryComponents: [
		
	]
})
export class MaterialsModule {}
