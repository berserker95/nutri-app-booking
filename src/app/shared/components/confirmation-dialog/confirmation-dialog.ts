import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ConfirmationDialogData } from './type';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [LucideAngularModule],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
  host: { class: 'block bg-white p-6 rounded-lg shadow-lg sm:max-w-lg max-w-sm'}
})
export class ConfirmationDialog {
  readonly #dialogRef = inject(DialogRef<boolean>);
  protected readonly _data = inject<ConfirmationDialogData>(DIALOG_DATA);

  onClose(): void {
    this.#dialogRef.close(true);
  }
}
