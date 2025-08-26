import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicBooking } from './public-booking';

describe('PublicBooking', () => {
  let component: PublicBooking;
  let fixture: ComponentFixture<PublicBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicBooking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicBooking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
