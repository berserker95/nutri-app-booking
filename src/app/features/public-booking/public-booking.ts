import { Component } from '@angular/core';
import { LucideAngularModule, User } from 'lucide-angular';
import { BookingStepper } from './components/booking-stepper/booking-stepper';


@Component({
  selector: 'app-public-booking',
  imports: [LucideAngularModule, BookingStepper],
  templateUrl: './public-booking.html',
  styleUrl: './public-booking.scss'
})
export class PublicBooking {
  readonly UserIcon = User;
  doctorName = 'Dott.ssa Federica Mancrasso';
  doctorTitle = 'Biologa Nutrizionista';

  constructor() {}


}
