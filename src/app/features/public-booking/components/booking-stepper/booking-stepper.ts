import { Component, inject, signal, computed, effect } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { z } from 'zod';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { ConfirmationDialog } from 'app/shared/components/confirmation-dialog/confirmation-dialog';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DialogFormData } from './type';

// Zod schemas for validation
const PersonalInfoSchema = z.object({
  fullName: z
    .string()
    .min(1, 'campo obbligatorio')
    .max(100, 'il campo è troppo lungo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'il campo contiene caratteri non validi'),

  email: z
    .email('Email non valida')
    .min(1, 'campo obbligatorio')
    .max(254, 'il campo è troppo lungo'),

  phone: z
    .string()
    .min(1, 'campo obbligatorio')
    .regex(/^(?:\+39)?(?:3\d{8,9}|0\d{8,9})$/, 'Numero di telefono non valido')
    .transform((val) => val.replace(/\s+/g, '')), // Remove spaces
});

const BookingInfoSchema = z.object({
  visitType: z.enum(['first-visit-office', 'first-visit-online', 'periodic-checkup', 'sports-specialist'], {
    message: 'Seleziona un tipo di visita valido',
  }),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Seleziona una data a partire da oggi'),

  time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Inserisci un orario valido (HH:MM)'
    )
    .refine((timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes >= 9 * 60 && totalMinutes <= 17 * 60; // 9 AM to 5 PM
    }, 'Orari disponibili: 09:00 - 17:00'),
});

const FullBookingSchema = z.object({
  personal: PersonalInfoSchema,
  booking: BookingInfoSchema,
});

// Type definitions
type FullBooking = z.infer<typeof FullBookingSchema>;

// Enhanced step configuration
interface StepConfig {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly formGroup: keyof FullBooking;
  readonly schema: z.ZodSchema<any>;
  readonly isOptional?: boolean;
}

// Custom validator factory using Zod
function zodValidator<T>(schema: z.ZodSchema<T>) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const result = schema.safeParse(control.value);
    if (result.success) return null;

    const errors: ValidationErrors = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path || 'root'] = issue.message;
    });

    return errors;
  };
}

@Component({
  selector: 'app-booking-stepper',
  standalone: true,
  imports: [
    LucideAngularModule,
    ReactiveFormsModule,
    DialogModule,
  ],
  templateUrl: './booking-stepper.html',
  styleUrl: './booking-stepper.scss',
})
export class BookingStepper {
  // Injected dependencies
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(Dialog);

  // Step configuration
  readonly STEPS: readonly StepConfig[] = [
    {
      id: 1,
      title: 'Informazioni personali',
      description: 'Fornisci i tuoi dati di contatto',
      formGroup: 'personal',
      schema: PersonalInfoSchema,
    },
    {
      id: 2,
      title: 'Dettagli prenotazione',
      description: 'Seleziona tipo di visita, data e ora preferiti',
      formGroup: 'booking',
      schema: BookingInfoSchema,
    },
    {
      id: 3,
      title: 'Conferma',
      description: 'Controlla e conferma la tua prenotazione',
      formGroup: 'personal', // Not used for validation step
      schema: z.any(),
    },
  ] as const;

  // Reactive state
  readonly currentStep = signal<number>(1);
  readonly isSubmitting = signal<boolean>(false);
  readonly submitError = signal<string | null>(null);

  // Track validity per step so computed can re-evaluate when form changes
  readonly personalValid = signal<boolean>(false);
  readonly bookingValid = signal<boolean>(false);

  // Form setup with enhanced validation
  bookingForm: FormGroup = this.fb.group({
    personal: this.fb.group({
      fullName: [
        'Mario Rossi',
        [Validators.required, zodValidator(PersonalInfoSchema.shape.fullName)],
      ],
      email: [
        'mario.rossi@gmail.com',
        [Validators.required, zodValidator(PersonalInfoSchema.shape.email)],
      ],
      phone: [
        '3281438290',
        [Validators.required, zodValidator(PersonalInfoSchema.shape.phone)],
      ],
    }),
    booking: this.fb.group({
      visitType: [
        'first-visit-office',
        [Validators.required, zodValidator(BookingInfoSchema.shape.visitType)],
      ],
      date: [
        '2025-09-30',
        [Validators.required, zodValidator(BookingInfoSchema.shape.date)],
      ],
      time: [
        '09:30',
        [Validators.required, zodValidator(BookingInfoSchema.shape.time)],
      ],
    }),
  });

  // Computed properties
  readonly currentStepConfig = computed(
    () =>
      this.STEPS.find((step) => step.id === this.currentStep()) ?? this.STEPS[0]
  );

  readonly isFirstStep = computed(() => this.currentStep() === 1);
  readonly isLastStep = computed(
    () => this.currentStep() === this.STEPS.length
  );
  readonly isConfirmationStep = computed(
    () => this.currentStep() === this.STEPS.length
  );

  readonly canProceed = computed(() => {
    const step = this.currentStepConfig();
    const formGroup = this.bookingForm.get(step.formGroup) as FormGroup | null;
    if (!formGroup) return false;

    // Use per-step validity signals so computed re-evaluates when forms change
    if (step.formGroup === 'personal') {
      return this.personalValid();
    }
    if (step.formGroup === 'booking') {
      return this.bookingValid();
    }

    // fallback
    return formGroup.valid;
  });

  // Form data computed property
  readonly formData = computed(() => {
    const rawValue = this.bookingForm.value;
    const result = FullBookingSchema.safeParse(rawValue);
    return result.success ? result.data : null;
  });

  readonly progressPercentage = computed(() =>
    Math.round((this.currentStep() / this.STEPS.length) * 100)
  );

  // Form state getters for template
  get personalForm(): FormGroup {
    return this.bookingForm.get('personal') as FormGroup;
  }
  get bookingFormGroup(): FormGroup {
    return this.bookingForm.get('booking') as FormGroup;
  }

  constructor() {
    this.setupFormEffects();

    // Keep form control validity up-to-date when user types
    const personal = this.bookingForm.get('personal') as FormGroup | null;
    if (personal) {
      // set initial
      this.personalValid.set(personal.valid);
      (personal.valueChanges as any).pipe(debounceTime(200)).subscribe(() => {
        Object.values(personal.controls).forEach((c) =>
          c.updateValueAndValidity({ emitEvent: false })
        );
        this.personalValid.set(personal.valid);
        console.log(
          'personal validity',
          personal.valid,
          personal.errors,
          personal.value
        );
      });
    }

    const booking = this.bookingForm.get('booking') as FormGroup | null;
    if (booking) {
      // set initial
      this.bookingValid.set(booking.valid);
      (booking.valueChanges as any).pipe(debounceTime(200)).subscribe(() => {
        Object.values(booking.controls).forEach((c) =>
          c.updateValueAndValidity({ emitEvent: false })
        );
        this.bookingValid.set(booking.valid);
        console.log(
          'booking validity',
          booking.valid,
          booking.errors,
          booking.value
        );
      });
    }
  }

  ngOnInit(): void {
    this.setupFormChangeHandling();
  }

  // Navigation methods
  nextStep(): void {
    if (!this.canProceed()) {
      this.markCurrentStepAsTouched();
      return;
    }

    if (this.isConfirmationStep()) {
      this.submitBooking();
      return;
    }

    this.currentStep.update((step) => Math.min(step + 1, this.STEPS.length));
  }

  previousStep(): void {
    this.currentStep.update((step) => Math.max(step - 1, 1));
  }

  goToStep(stepNumber: number): void {
    if (stepNumber < 1 || stepNumber > this.STEPS.length) return;

    // Only allow going to previous steps or current step
    if (stepNumber <= this.currentStep()) {
      this.currentStep.set(stepNumber);
    }
  }

  // Form submission
  private async submitBooking(): Promise<void> {
    const formData = this.formData();
    if (!formData) {
      this.submitError.set('Invalid form data. Please check all fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      // Simulate API call
      await this.mockApiSubmission(formData);

      console.log('Booking confirmed:', formData);
      // TODO: Implement actual submission logic
      // - Send to API
      // - Send confirmation email/WhatsApp
      // - Redirect to success page

      this.openConfirmationDialog();
    } catch (error) {
      this.submitError.set(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private openConfirmationDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      disableClose: true,
      data: {
        title: 'Prenotazione Confermata',
        message:
          'La tua prenotazione è stata effettuata con successo. Di seguito i dettagli della tua prenotazione.',
        confirmButtonLabel: 'Nuova Prenotazione',
        extraInfos: this.mapFormDataForDialog(),
      },
    });

    dialogRef.closed.subscribe(() => {
      this.resetForm();
    });
  }

  private mapFormDataForDialog(): DialogFormData | null {
    const data = this.formData();
    if (!data) return null;
    return {
      date: this.formatDate(data.booking.date),
      time: data.booking.time,
      visitType: this.getVisitTypeLabel(data.booking.visitType),
      email: data.personal.email,
      phone: data.personal.phone,

    };
  }
  // Utility methods
  private markCurrentStepAsTouched(): void {
    const step = this.currentStepConfig();
    const formGroup = this.bookingForm.get(step.formGroup);
    formGroup?.markAllAsTouched();
  }

  private setupFormChangeHandling(): void {
    // Auto-save form data on changes with debounce
    this.bookingForm.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((value) => {
        // Auto-save to localStorage or sessionStorage
        this.autoSaveFormData(value);
      });
  }

  private setupFormEffects(): void {
    // Effect to clear errors when form becomes valid
    effect(() => {
      if (this.canProceed() && this.submitError()) {
        this.submitError.set(null);
      }
    });
  }

  private autoSaveFormData(data: any): void {
    try {
      // Note: In Claude artifacts, we use in-memory storage instead of localStorage
      // In a real application, you would use:
      // localStorage.setItem('booking-form-draft', JSON.stringify(data));
      console.log('Auto-saved form data:', data);
    } catch (error) {
      console.warn('Failed to auto-save form data:', error);
    }
  }

  private resetForm(): void {
    this.bookingForm.reset();
    this.currentStep.set(1);
    this.isSubmitting.set(false);
    this.submitError.set(null);
  }

  private async mockApiSubmission(data: FullBooking): Promise<void> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate occasional API errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Network error. Please try again.');
    }
  }

  // Template helper methods
  getFieldError(controlPath: string): string | null {
    const c = this.bookingForm.get(controlPath);
    if (!c?.touched || !c.errors) return null;
    return c.errors['required']
      ? 'campo obbligatorio'
      : c.errors['root'] ?? null;
  }

  isFieldInvalid(controlPath: string): boolean {
    const control = this.bookingForm.get(controlPath);
    return !!(control?.invalid && control.touched);
  }

  // Class helper methods for template
  getStepCircleClasses(stepId: number): string {
    const current = this.currentStep();
    if (current === stepId) {
      return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg transform scale-110 cursor-pointer hover:shadow-md';
    } else if (current > stepId) {
      return 'bg-emerald-500 text-white cursor-pointer hover:shadow-md';
    } else {
      return 'bg-white text-slate-800 border-2 border-slate-300 cursor-not-allowed opacity-50';
    }
  }

  getStepLabelClasses(stepId: number): string {
    return this.currentStep() >= stepId ? 'text-emerald-600' : 'text-slate-600';
  }

  getConnectionLineClasses(stepId: number): string {
    return this.currentStep() > stepId ? 'bg-emerald-500' : 'bg-slate-300';
  }

  getFieldInputClasses(controlPath: string): string {
    const control = this.bookingForm.get(controlPath);
    if (control?.invalid && control.touched) {
      return 'border-red-300 bg-red-50';
    } else if (control?.valid && control.touched) {
      return 'border-emerald-300 bg-emerald-50';
    }
    return '';
  }

  getTimeSlotLabelClasses(available: boolean): string {
    return available ? '' : 'cursor-not-allowed opacity-50 pointer-events-none';
  }

  getTimeSlotClasses(available: boolean): string {
    return available
      ? 'peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:border-slate-300'
      : 'border-slate-100 bg-slate-50 text-slate-400';
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getVisitTypeLabel(value: string): string {
    const option = this.visitTypeOptions.find((opt) => opt.value === value);
    return option ? option.label : value || '-';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', { dateStyle: 'full' }).format(date);
  }

  readonly visitTypeOptions = [
    {
      value: 'first-visit-office',
      label: 'Prima visita in studio',
      description:
        'Prima consultazione medica presso lo studio della dottoressa con anamnesi dettagliata',
    },
    {
      value: 'first-visit-online',
      label: 'Prima visita online',
      description:
        'Prima consultazione medica tramite videocall per valutazione iniziale e consulenza a distanza',
    },
    {
      value: 'periodic-checkup',
      label: 'Controllo periodico',
      description:
        'Visita di controllo programmata per monitorare condizioni esistenti e valutare progressi terapeutici',
    },
    {
      value: 'sports-specialist',
      label: 'Visita specialistica sportiva',
      description:
        'Valutazione medico-sportiva specializzata per atleti con focus su performance e prevenzione infortuni',
    },
  ] as const;

  readonly timeSlots = [
    { value: '09:00', label: '09:00', available: true },
    { value: '09:30', label: '09:30', available: true },
    { value: '10:00', label: '10:00', available: true },
    { value: '10:30', label: '10:30', available: false },
    { value: '11:00', label: '11:00', available: false },
    { value: '11:30', label: '11:30', available: true },
    { value: '12:00', label: '12:00', available: true },
    { value: '14:00', label: '14:00', available: true },
    { value: '14:30', label: '14:30', available: true },
    { value: '15:00', label: '15:00', available: true },
    { value: '15:30', label: '15:30', available: false },
    { value: '16:00', label: '16:00', available: true },
    { value: '16:30', label: '16:30', available: true },
    { value: '17:00', label: '17:00', available: true },
  ] as const;
}
