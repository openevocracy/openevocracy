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
	MatDialogModule/*,
	MatIconModule*/
} from '@angular/material';

import { ShareDialogComponent } from '../dialogs/share/share.component';

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
		MatDialogModule/*,
		MatIconModule*/
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
		MatDialogModule/*,
		MatIconModule*/
	],
	entryComponents: [
		ShareDialogComponent
	]
})
export class MaterialModule {}
