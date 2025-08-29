import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ConfirmationDialog } from './confirmation-dialog';
import { ConfirmationDialogData } from './type';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIcons } from 'assets/icons/icons';

describe('ConfirmationDialog', () => {
  let component: ConfirmationDialog;
  let fixture: ComponentFixture<ConfirmationDialog>;
  let dialogRef: jasmine.SpyObj<DialogRef<boolean>>;
  let mockData: ConfirmationDialogData;

  beforeEach(async () => {
    // Create spy for DialogRef
    dialogRef = jasmine.createSpyObj('DialogRef', ['close']);

    // Mock data for testing
    mockData = {
      title: 'Prenotazione Confermata',
      message: 'La tua prenotazione è stata effettuata con successo.',
      confirmButtonLabel: 'Chiudi',
      extraInfos: {
        date: '15/03/2025',
        time: '14:30',
        visitType: 'Prima visita online',
        email: 'test@example.com',
        phone: '3291234567'
      }
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmationDialog],
      providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(LucideAngularModule.pick(LucideIcons)),
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct host attributes', () => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.getAttribute('role')).toBe('dialog');
      expect(element.getAttribute('aria-modal')).toBe('true');
      expect(element.getAttribute('aria-labelledby')).toBe('dialog-title');
    });
  });

  describe('Content Rendering', () => {
    it('should display title from data', () => {
      const titleElement = fixture.nativeElement.querySelector('h2');
      expect(titleElement?.textContent?.trim()).toBe(mockData.title);
    });

    it('should display message from data', () => {
      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement?.textContent?.trim()).toBe(mockData.message);
    });

    it('should display button with correct label', () => {
      const buttonElement = fixture.nativeElement.querySelector('button');
      expect(buttonElement?.textContent?.trim()).toContain(mockData.confirmButtonLabel);
    });

    it('should display success icon', () => {
      const iconElement = fixture.nativeElement.querySelector('lucide-angular[name="circle-check"]');
      expect(iconElement).toBeTruthy();
    });
  });

  describe('Extra Information', () => {
    it('should display extra information when provided', () => {
      const extraInfoSection = fixture.nativeElement.querySelector('.bg-gray-50');
      expect(extraInfoSection).toBeTruthy();
    });

    it('should display all extra information fields', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain(mockData.extraInfos!.date);
      expect(compiled.textContent).toContain(mockData.extraInfos!.time);
      expect(compiled.textContent).toContain(mockData.extraInfos!.visitType);
      expect(compiled.textContent).toContain(mockData.extraInfos!.email);
      expect(compiled.textContent).toContain(mockData.extraInfos!.phone);
    });

    it('should not display extra information section when not provided', async () => {
      // Update data without extraInfos
      const dataWithoutExtra = { ...mockData, extraInfos: undefined };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ConfirmationDialog],
        providers: [
          provideZonelessChangeDetection(),
          importProvidersFrom(LucideAngularModule.pick(LucideIcons)),
          { provide: DialogRef, useValue: dialogRef },
          { provide: DIALOG_DATA, useValue: dataWithoutExtra }
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(ConfirmationDialog);
      newFixture.detectChanges();

      const extraInfoSection = newFixture.nativeElement.querySelector('.bg-gray-50');
      expect(extraInfoSection).toBeFalsy();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when button is clicked', () => {
      spyOn(component, 'onClose');

      const button = fixture.nativeElement.querySelector('button');
      button?.click();

      expect(component.onClose).toHaveBeenCalled();
    });

    it('should close dialog with true when onClose is called', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on success icon', () => {
      const icon = fixture.nativeElement.querySelector('lucide-angular[name="circle-check"]');
      expect(icon?.getAttribute('aria-label')).toBe('Operazione completata con successo');
      expect(icon?.getAttribute('role')).toBe('img');
    });

    it('should have proper aria-label on button', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBe(mockData.confirmButtonLabel);
    });
  });
});
