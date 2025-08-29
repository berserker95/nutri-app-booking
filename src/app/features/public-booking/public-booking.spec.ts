import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicBooking } from './public-booking';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIcons } from 'assets/icons/icons';
import { BookingStepper } from './components/booking-stepper/booking-stepper';

describe('PublicBooking', () => {
  let component: PublicBooking;
  let fixture: ComponentFixture<PublicBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicBooking, BookingStepper],
      providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(LucideAngularModule.pick(LucideIcons)),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PublicBooking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should render doctor name and title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#doctor-name')?.textContent).toContain(component.doctorName);
    expect(compiled.querySelector('#doctor-title')?.textContent).toContain(component.doctorTitle);
  });

  it('should have the UserIcon defined', () => {
    expect(component.UserIcon).toBeTruthy();
  });
});
