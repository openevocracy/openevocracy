import { NgModule } from '@angular/core';

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
	MatSlideToggleModule
} from '@angular/material';

import { ShareDialogComponent } from '../dialogs/share/share.component';
import { NewThreadDialogComponent } from '../dialogs/newthread/newthread.component';

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
		MatSlideToggleModule
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
		MatSlideToggleModule
	],
	entryComponents: [
		ShareDialogComponent,
		NewThreadDialogComponent
	]
})
export class MaterialModule {}
