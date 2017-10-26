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
		MatRippleModule
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
		MatRippleModule
	]
})
export class MaterialModule {}
