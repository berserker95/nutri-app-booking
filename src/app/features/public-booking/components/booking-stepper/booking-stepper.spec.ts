import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingStepper } from './booking-stepper';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIcons } from 'assets/icons/icons';
import { ReactiveFormsModule } from '@angular/forms';

describe('BookingStepper', () => {
  let component: BookingStepper;
  let fixture: ComponentFixture<BookingStepper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingStepper, ReactiveFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(LucideAngularModule.pick(LucideIcons)),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BookingStepper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('Stepper navigation', () => {
    it('should go to next step', () => {
      const initialStep = component.currentStep();
      component.nextStep();
      expect(component.currentStep()).toBe(initialStep + 1);
    });

    it('should go back to previous step', () => {
      component.nextStep(); // move to step 2
      component.previousStep();
      expect(component.currentStep()).toBe(1);
    });

    it('should go directly to a specific step', () => {
      component.personalForm.setValue({
        fullName: 'Mario Rossi',
        email: 'test@email.com',
        phone: '099232456',
      });
      component.goToStep(2);
      expect(component.currentStep()).toBe(1);
    });
    it('should not go past the last step without valid forms', () => {
      component.goToStep(component.STEPS.length);
      expect(component.currentStep()).toBeLessThan(component.STEPS.length);
    });

    it('should stop at last step when trying to advance further', () => {
      // Step 1 valid
      component.personalForm.setValue({
        fullName: 'Mario Rossi',
        email: 'mario@test.com',
        phone: '099232456',
      });

      component.nextStep(); // move to step 2
      expect(component.currentStep()).toBe(2);

      // Step 2 valid
      component.bookingFormGroup.setValue({
        visitType: 'online',
        date: '2025-09-01',
        time: '10:00',
      });

      component.nextStep(); // move to step 3
      expect(component.currentStep()).toBe(3);

      component.nextStep(); // try to go past last step
      expect(component.currentStep()).toBe(3); // should stay at max
    })
  });
});
