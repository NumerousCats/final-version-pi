import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthStore } from '../../../core/state/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { RidesStore } from '../../../core/state/rides.store';
import { BookingsStore } from '../../../core/state/bookings.store';
import { RideService } from '../../../core/services/ride.service';
import { BookingService } from '../../../core/services/booking.service';
import { Ride } from '../../../core/models/ride.model';
import { User } from '../../../core/models/user.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

/**
 * Book Ride component
 * Allows passengers to book a specific ride
 * Shows ride details and booking form
 */
@Component({
  selector: 'app-book-ride',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CardComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      @if (ride) {
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Book Ride</h1>
        </div>

        <!-- Ride Details -->
        <app-card class="mb-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Ride Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Route</p>
              <p class="font-semibold text-gray-900 dark:text-gray-100">
                {{ ride.departureCity }} → {{ ride.destinationCity }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Departure</p>
              <p class="font-semibold text-gray-900 dark:text-gray-100">
                {{ ride.departureDate | date:'short' }} at {{ ride.departureTime }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Driver</p>
              <button
                  (click)="viewDriverProfile()"
                  class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-colors text-left"
              >
                {{ getDriverName() }}
                @if (driver) {
                  <span class="text-yellow-500 ml-2">⭐ {{ driver.rating?.toFixed(1) || 'N/A' }}</span>
                }
              </button>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Available Seats</p>
              <p class="font-semibold text-gray-900 dark:text-gray-100">{{ ride.availableSeats }}</p>
            </div>
          </div>
        </app-card>

        <!-- Booking Form -->
        <app-card>
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Booking Information</h2>
          <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
            <app-input
                id="seats"
                label="Number of Seats"
                type="number"
                placeholder="1"
                formControlName="seats"
                [required]="true"
                [error]="getErrorMessage('seats')"
            />

            @if (errorMessage) {
              <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
              </div>
            }

            <div class="flex space-x-4">
              <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [loading]="loading"
                  [disabled]="!bookingForm.valid"
              >
                Confirm Booking
              </app-button>
              <app-button
                  type="button"
                  variant="secondary"
                  size="lg"
                  (onClick)="cancel()"
              >
                Cancel
              </app-button>
            </div>
          </form>
        </app-card>
      } @else {
        <app-card>
          <div class="text-center py-12">
            @if (errorMessage) {
              <div class="mb-4">
                <svg class="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-red-600 dark:text-red-400 text-lg font-semibold">{{ errorMessage }}</p>
                <p class="text-gray-500 dark:text-gray-400 mt-2">Redirecting to dashboard...</p>
              </div>
            } @else {
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p class="text-gray-600 dark:text-gray-400 mt-4">Loading ride details...</p>
            }
          </div>
        </app-card>
      }
    </div>
  `,
  styles: []
})
export class BookRideComponent implements OnInit {
  ride: Ride | null = null;
  driver: User | null = null;
  bookingForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private fb: FormBuilder,
      private authStore: AuthStore,
      private authService: AuthService,
      private ridesStore: RidesStore,
      private bookingsStore: BookingsStore,
      private rideService: RideService,
      private bookingService: BookingService
  ) {
    this.bookingForm = this.fb.group({
      seats: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const rideId = this.route.snapshot.paramMap.get('id');
    if (rideId) {
      this.loadRide(rideId);
    }
  }

  loadRide(rideId: string): void {
    console.log('=== Loading Ride ===');
    console.log('Ride ID:', rideId);

    // Always fetch from API to get the most up-to-date ride information
    this.rideService.getRideById(rideId).subscribe({
      next: (ride) => {
        console.log('Ride loaded:', ride);
        if (ride) {
          this.ride = ride;
          this.ridesStore.addRide(ride);
          this.ridesStore.setSelectedRide(ride);
          this.setupFormValidation();
          this.loadDriver(ride.driverId);
        } else {
          console.error('Ride is undefined');
          this.errorMessage = 'Ride not found';
          setTimeout(() => {
            this.router.navigate(['/passenger/dashboard']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error loading ride:', error);
        this.errorMessage = 'Failed to load ride details';
        setTimeout(() => {
          this.router.navigate(['/passenger/dashboard']);
        }, 2000);
      }
    });
  }

  loadDriver(driverId: string): void {
    this.authService.getUserById(driverId).subscribe({
      next: (driver) => {
        this.driver = driver;
      },
      error: (error) => {
        console.error('Error loading driver:', error);
      }
    });
  }

  getDriverName(): string {
    return this.driver?.name || this.driver?.email?.split('@')[0] || 'Loading...';
  }

  viewDriverProfile(): void {
    if (this.ride?.driverId) {
      this.router.navigate(['/profile', this.ride.driverId]);
    }
  }

  private setupFormValidation(): void {
    if (this.ride) {
      // Set max seats validation
      this.bookingForm.get('seats')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.ride.availableSeats)
      ]);
      this.bookingForm.get('seats')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.bookingForm.valid && this.ride) {
      this.loading = true;
      this.errorMessage = '';

      const seats = this.bookingForm.get('seats')?.value;
      const user = this.authStore.currentUser();

      if (!user) {
        this.errorMessage = 'You must be logged in to book a ride';
        this.loading = false;
        return;
      }

      if (seats > this.ride.availableSeats) {
        this.errorMessage = 'Not enough available seats';
        this.loading = false;
        return;
      }

      const newAvailableSeats = this.ride.availableSeats - seats;

      // First, create the booking
      this.bookingService.createBooking(this.ride.id, user.id, seats, this.ride).subscribe({
        next: (booking) => {
          // After booking is created, update the ride seats
          this.rideService.modifyRide(this.ride!.id, { availableSeats: newAvailableSeats }).subscribe({
            next: (updatedRide) => {
              // Update bookings store with new booking
              this.bookingsStore.addBooking(booking);

              // Update ride availability in rides store
              this.ridesStore.updateRide(this.ride!.id, {
                availableSeats: newAvailableSeats
              });

              this.loading = false;
              this.router.navigate(['/passenger/bookings']);
            },
            error: (error) => {
              this.loading = false;
              this.errorMessage = 'Booking created but failed to update seats. Please contact support.';
              console.error('Error updating ride seats:', error);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to book ride. Please try again.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/passenger/dashboard']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.bookingForm.get(controlName);
    if (control?.hasError('required') && control.touched) {
      return 'Number of seats is required';
    }
    if (control?.hasError('min') && control.touched) {
      return 'Must book at least 1 seat';
    }
    if (control?.hasError('max') && control.touched) {
      return `Only ${this.ride?.availableSeats || 0} seats available`;
    }
    return '';
  }
}