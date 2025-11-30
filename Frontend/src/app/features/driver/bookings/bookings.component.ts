import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, of, takeUntil, switchMap, map, catchError } from 'rxjs';

import { AuthStore } from '../../../core/state/auth.store';
import { BookingService } from '../../../core/services/booking.service';
import { RideService } from '../../../core/services/ride.service';
import { AuthService } from '../../../core/services/auth.service';

import { Booking, BookingStatus } from '../../../core/models/ride.model';
import { Ride } from '../../../core/models/ride.model';
import { User } from '../../../core/models/user.model';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-driver-bookings',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Booking Requests</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Manage booking requests for your rides
        </p>
      </div>

      <div class="space-y-4">
        <!-- bookings list -->
        <ng-container *ngIf="bookings?.length; else emptyState">
          <ng-container *ngFor="let booking of bookings; trackBy: trackByBookingId">
            <app-card>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-4 mb-4">
                    <div class="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                      {{ getInitials(booking.passenger?.name || 'Unknown') }}
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ booking.passenger?.name || 'Unknown Passenger' }}
                      </h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ booking.ride?.departureCity || 'N/A' }} → {{ booking.ride?.destinationCity || 'N/A' }}
                      </p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Seats</p>
                      <p class="font-medium text-gray-900 dark:text-gray-100">{{ booking.seatsRequested }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Date</p>
                      <p class="font-medium text-gray-900 dark:text-gray-100">
                        {{ booking.ride?.departureDate | date:'short' || 'N/A' }}

                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <span [class]="getStatusClass(booking.status)">
                        {{ booking.status }}
                      </span>
                    </div>
                  </div>
                </div>

                <div *ngIf="booking.status === BookingStatus.PENDING" class="flex flex-col space-y-2 ml-4">
                  <app-button
                      variant="primary"
                      size="sm"
                      (onClick)="acceptBooking(booking.id)"
                      [loading]="loadingBookings.has(booking.id)"
                  >
                    Accept
                  </app-button>
                  <app-button
                      variant="danger"
                      size="sm"
                      (onClick)="rejectBooking(booking.id)"
                      [loading]="loadingBookings.has(booking.id)"
                  >
                    Reject
                  </app-button>
                </div>
              </div>
            </app-card>
          </ng-container>
        </ng-container>

        <ng-template #emptyState>
          <app-card>
            <div class="text-center py-12">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-gray-600 dark:text-gray-400">No booking requests yet</p>
            </div>
          </app-card>
        </ng-template>
      </div>
    </div>
  `,
  styles: []
})
export class DriverBookingsComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  loadingBookings = new Set<string>();

  private rideCache = new Map<string, Ride | undefined>();
  private userCache = new Map<string, User | undefined>();

  private destroy$ = new Subject<void>();

  BookingStatus = BookingStatus;

  constructor(
      private authStore: AuthStore,
      private bookingService: BookingService,
      private rideService: RideService,
      private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByBookingId(index: number, b: Booking): string {
    return b.id;
  }

  loadBookings(): void {
    const user = this.authStore.currentUser();
    if (!user) {
      this.bookings = [];
      return;
    }

    // 1) fetch raw bookings from booking service
    this.bookingService.getDriverBookingRequests(user.id)
        .pipe(
            takeUntil(this.destroy$),
            switchMap((bookings) => {
              if (!bookings || bookings.length === 0) {
                return of([] as Booking[]);
              }

              // For each booking, ensure we have ride & passenger (cached when possible)
              const enriched$ = bookings.map(b => {
                const ride$ = this.getRideCached(b.rideId);
                const passenger$ = this.getUserCached(b.passengerId);

                // combine both - if ride or passenger call fails, we still return the booking (with undefined fields)
                return forkJoin({
                  ride: ride$.pipe(catchError(() => of(undefined))),
                  passenger: passenger$.pipe(catchError(() => of(undefined))),
                  booking: of(b)
                }).pipe(
                    map(({ booking, ride, passenger }) => {
                      // merge into booking shape expected by template / mapper
                      return {
                        ...booking,
                        ride: ride || (booking as any).ride || undefined,
                        passenger: passenger || (booking as any).passenger || undefined
                      } as Booking;
                    })
                );
              });

              // forkJoin on array of observables -> returns Booking[]
              return forkJoin(enriched$);
            })
        )
        .subscribe({
          next: (fullBookings) => {
            this.bookings = fullBookings || [];
          },
          error: (err) => {
            console.error('Error loading bookings:', err);
            this.bookings = [];
          }
        });
  }

  /**
   * Returns cached ride observable or fetches from rideService and caches result.
   */
  private getRideCached(rideId?: string) {
    if (!rideId) return of(undefined);
    if (this.rideCache.has(rideId)) {
      return of(this.rideCache.get(rideId));
    }

    return this.rideService.getRideById(rideId).pipe(
        map(ride => {
          this.rideCache.set(rideId, ride);
          return ride;
        })
    );
  }

  /**
   * Returns cached user observable or fetches from authService and caches result.
   */
  private getUserCached(userId?: string) {
    if (!userId) return of(undefined);
    if (this.userCache.has(userId)) {
      return of(this.userCache.get(userId));
    }

    return this.authService.getUserById(userId).pipe(
        map(user => {
          this.userCache.set(userId, user);
          return user;
        })
    );
  }

  acceptBooking(bookingId: string): void {
    if (!bookingId) return;
    const user = this.authStore.currentUser();
    const driverId = user?.id;
    this.loadingBookings.add(bookingId);

    this.bookingService.acceptBooking(bookingId, driverId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        // update local booking status so UI updates immediately
        const idx = this.bookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) {
          this.bookings[idx] = { ...this.bookings[idx], status: BookingStatus.ACCEPTED };
        }
        this.loadingBookings.delete(bookingId);
      },
      error: (err) => {
        console.error('Error accepting booking:', err);
        this.loadingBookings.delete(bookingId);
      }
    });
  }

  rejectBooking(bookingId: string): void {
    if (!bookingId) return;
    const user = this.authStore.currentUser();
    const driverId = user?.id;
    this.loadingBookings.add(bookingId);

    this.bookingService.rejectBooking(bookingId, driverId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        // update local booking status so UI updates immediately
        const idx = this.bookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) {
          this.bookings[idx] = { ...this.bookings[idx], status: BookingStatus.REJECTED };
        }
        this.loadingBookings.delete(bookingId);
      },
      error: (err) => {
        console.error('Error rejecting booking:', err);
        this.loadingBookings.delete(bookingId);
      }
    });
  }

  getStatusClass(status: BookingStatus): string {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case BookingStatus.ACCEPTED:
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`;
      case BookingStatus.REJECTED:
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      case BookingStatus.PENDING:
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300`;
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2);
  }
}
