import { NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule} from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';

const arr = [
	MatSidenavModule,
	MatDialogModule,
	MatCardModule,
	MatSnackBarModule,
	MatSlideToggleModule,
	MatFormFieldModule,
	MatInputModule,
	MatIconModule,
	MatToolbarModule,
	MatListModule,
	MatButtonModule,
	MatProgressSpinnerModule,
	MatSelectModule,
	MatMenuModule,
	MatRippleModule,
	MatBadgeModule
];

@NgModule({
  imports: arr,
  exports: arr,
})
export class MaterialImports { }