import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '../../../core/state/auth.store';
import { BookingService } from '../../../core/services/booking.service';
import { RideService } from '../../../core/services/ride.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking, BookingStatus, Ride } from '../../../core/models/ride.model';
import { User } from '../../../core/models/user.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-passenger-bookings',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, ButtonComponent, CardComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">My Bookings</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Track your ride bookings and status</p>
      </div>

      @if (loading) {
        <app-card>
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p class="text-gray-600 dark:text-gray-400 mt-4">Loading bookings...</p>
          </div>
        </app-card>
      }

      @if (!loading) {
        <div class="space-y-4">

          @for (booking of bookings; track booking.id) {
            <app-card>
              <div class="flex-1">

                <!-- FIXED HEADER -->
                <div class="flex justify-between items-start mb-4">

                  <!-- Left: ride title -->
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {{ getRideInfo(booking.rideId)?.departureCity || 'Loading...' }} →
                    {{ getRideInfo(booking.rideId)?.destinationCity || 'Loading...' }}
                  </h3>

                  <!-- Right: status + cancel -->
                  <div class="flex items-center gap-3">

                    <span [class]="getStatusClass(booking.status)">
                      {{ booking.status }}
                    </span>

                    @if (booking.status === BookingStatus.PENDING) {
                      <app-button
                          variant="danger"
                          size="sm"
                          class="ml-2"
                          (onClick)="openCancelDialog(booking.id)"
                      >
                        Cancel
                      </app-button>
                    }
                  </div>

                </div>

                <!-- Date/time -->
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ getRideInfo(booking.rideId)?.departureDate | date:'short' }}
                  at {{ getRideInfo(booking.rideId)?.departureTime || 'Loading...' }}
                </p>

                <!-- Info grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Driver</p>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ getDriverName(booking.rideId) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Seats</p>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ booking.seatsRequested }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Booked On</p>
                    <p class="font-medium text-gray-900 dark:text-gray-100">
                      {{ booking.createdAt | date:'short' }}
                    </p>
                  </div>
                </div>

                @if (booking.status === BookingStatus.ACCEPTED) {
                  <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p class="text-sm text-green-800 dark:text-green-400">
                      ✅ Your booking has been accepted! Contact your driver for details.
                    </p>
                  </div>
                }
              </div>
            </app-card>
          }

          @empty {
            <app-card>
              <div class="text-center py-12">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-gray-600 dark:text-gray-400 mb-4">No bookings yet</p>
                <app-button variant="primary" (onClick)="navigateToDashboard()">Search for Rides</app-button>
              </div>
            </app-card>
          }

        </div>
      }
    </div>

    <!-- CANCEL DIALOG -->
    @if (showCancelDialog()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black bg-opacity-50" (click)="closeCancelDialog()"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">

            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div class="mt-4 text-center">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Cancel Booking?</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
            </div>

            <div class="mt-6 flex gap-3 justify-between">
              <app-button variant="secondary" size="md"
                          (onClick)="closeCancelDialog()" [disabled]="cancelling()">
                Keep Booking
              </app-button>

              <app-button variant="danger" size="md"
                          [loading]="cancelling()" (onClick)="confirmCancelBooking()">
                Yes, Cancel
              </app-button>
            </div>

          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class PassengerBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;
  rideCache: Map<string, Ride> = new Map();
  driverCache: Map<string, User> = new Map();

  showCancelDialog = signal(false);
  bookingToCancel = signal<string | null>(null);
  cancelling = signal(false);

  constructor(
      private authStore: AuthStore,
      private bookingService: BookingService,
      private rideService: RideService,
      private authService: AuthService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    const user = this.authStore.currentUser();
    if (!user) return;

    this.bookingService.getPassengerBookings(user.id).subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loadRidesAndDrivers(bookings);
      },
      error: () => (this.loading = false)
    });
  }

  loadRidesAndDrivers(bookings: Booking[]): void {
    const rideIds = [...new Set(bookings.map(b => b.rideId))];

    if (rideIds.length === 0) {
      this.loading = false;
      return;
    }

    forkJoin(rideIds.map(id => this.rideService.getRideById(id))).subscribe({
      next: (rides) => {
        rides.forEach((r, i) => r && this.rideCache.set(rideIds[i], r));

        const driverIds = [...new Set(rides.filter(r => r).map(r => r!.driverId))];

        forkJoin(driverIds.map(id => this.authService.getUserById(id))).subscribe({
          next: (drivers) => {
            drivers.forEach((d, i) => d && this.driverCache.set(driverIds[i], d));
            this.loading = false;
          },
          error: () => (this.loading = false)
        });
      },
      error: () => (this.loading = false)
    });
  }

  getRideInfo(rideId: string): Ride | undefined {
    return this.rideCache.get(rideId);
  }

  getDriverName(rideId: string): string {
    const ride = this.rideCache.get(rideId);
    if (!ride) return 'Loading...';

    const driver = this.driverCache.get(ride.driverId);
    return driver?.name || driver?.email?.split('@')[0] || 'Loading...';
  }

  openCancelDialog(bookingId: string): void {
    this.bookingToCancel.set(bookingId);
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void {
    this.showCancelDialog.set(false);
    this.bookingToCancel.set(null);
  }

  confirmCancelBooking(): void {
    const bookingId = this.bookingToCancel();
    if (!bookingId) return;

    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    this.cancelling.set(true);
    const passengerId = this.authStore.currentUser()?.id;

    this.bookingService.cancelBooking(bookingId, passengerId).subscribe({
      next: () => {
        // Return seats to the ride
        const ride = this.rideCache.get(booking.rideId);
        if (ride) {
          const updatedSeats = ride.availableSeats + booking.seatsRequested;
          this.rideService.modifyRide(ride.id, {
            availableSeats: updatedSeats
          }).subscribe({
            next: () => {
              console.log('Seats returned successfully');
              this.cancelling.set(false);
              this.closeCancelDialog();
              this.loadBookings();
            },
            error: (error) => {
              console.error('Failed to return seats:', error);
              // Even if modifying ride fails, still close dialog and reload
              this.cancelling.set(false);
              this.closeCancelDialog();
              this.loadBookings();
            }
          });
        } else {
          this.cancelling.set(false);
          this.closeCancelDialog();
          this.loadBookings();
        }
      },
      error: (error) => {
        console.error('Failed to cancel booking:', error);
        this.cancelling.set(false);
        this.closeCancelDialog();
        this.loadBookings();
      }
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/passenger/dashboard']);
  }

  getStatusClass(status: BookingStatus): string {
    const base = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case BookingStatus.ACCEPTED:
        return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`;
      case BookingStatus.REJECTED:
        return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      case BookingStatus.PENDING:
        return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`;
      case BookingStatus.CANCELLED:
        return `${base} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300`;
      default:
        return `${base} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300`;
    }
  }

  BookingStatus = BookingStatus;
}