import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule, User } from 'lucide-angular';


@Component({
  selector: 'app-public-booking',
  imports: [LucideAngularModule],
  templateUrl: './public-booking.html',
  styleUrl: './public-booking.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicBooking {
  readonly UserIcon = User;
  doctorName = 'Dott.ssa Federica Mancrasso';
  doctorTitle = 'Biologa Nutrizionista';

  constructor() {}


}
