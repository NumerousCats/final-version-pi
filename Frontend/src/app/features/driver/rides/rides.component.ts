import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '../../../core/state/auth.store';
import { RideService } from '../../../core/services/ride.service';
import { Ride, RideStatus } from '../../../core/models/ride.model';
import { formatDateTime } from '../../../core/utils/date.util';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';

/**
 * Driver Rides component
 * Lists all rides published by the driver
 */
@Component({
  selector: 'app-driver-rides',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, ButtonComponent, CardComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header Section with Gradient -->
      <div class="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 p-8 shadow-xl">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>

        <div class="relative z-10 flex justify-between items-center">
          <div>
            <h1 class="text-4xl font-bold text-white mb-2">My Rides 🚗</h1>
            <p class="text-primary-100 text-lg">
              All rides you've published and managed
            </p>
          </div>
          <app-button
              variant="primary"
              (onClick)="navigateToPublishRide()"
              class="bg-white text-primary-700 hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Publish New Ride
          </app-button>
        </div>
      </div>

      <!-- Rides Grid -->
      <div class="grid grid-cols-1 gap-6">
        @for (ride of rides; track ride.id) {
          <div class="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
            <!-- Status Indicator Line -->
            <div [class]="getStatusLineClass(ride.status)"></div>

            <div class="p-6">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <!-- Route Header -->
                  <div class="flex items-center gap-4 mb-6">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {{ ride.departureCity }}
                          <span class="text-primary-600 dark:text-primary-400 mx-2">→</span>
                          {{ ride.destinationCity }}
                        </h3>
                      </div>

                      <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400 ml-13">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="font-medium">{{ formatDateTime(ride.departureDate, ride.departureTime) }}</span>
                      </div>
                    </div>

                    <span [class]="getStatusClass(ride.status)">
                      {{ ride.status }}
                    </span>
                  </div>

                  <!-- Stats Grid -->
                  <div class="grid grid-cols-2 gap-6">
                    <!-- Available Seats -->
                    <div class="relative overflow-hidden p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                      <div class="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -mr-8 -mt-8"></div>
                      <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-1">
                          <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p class="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Available Seats</p>
                        </div>
                        <p class="text-2xl font-bold text-green-900 dark:text-green-100">
                          {{ ride.availableSeats }}<span class="text-sm text-green-600 dark:text-green-400">/{{ ride.totalSeats }}</span>
                        </p>
                      </div>
                    </div>

                    <!-- Passengers -->
                    <div class="relative overflow-hidden p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div class="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8"></div>
                      <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-1">
                          <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p class="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Passengers</p>
                        </div>
                        <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {{ ride.totalSeats - ride.availableSeats }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="mt-6 flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        [routerLink]="['/driver/rides', ride.id]"
                        class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg group"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                      <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>

                    @if (ride.status === RideStatus.SCHEDULED) {
                      <button
                          class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Ride
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div class="text-center py-20 px-6">
              <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full mb-6">
                <svg class="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                No Rides Yet
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Start your journey as a driver by publishing your first ride. Share your trips and connect with passengers heading the same way!
              </p>

              <app-button variant="primary" (onClick)="navigateToPublishRide()" class="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Publish Your First Ride
              </app-button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class DriverRidesComponent implements OnInit {
  rides: Ride[] = [];
  formatDateTime = formatDateTime;

  constructor(
      private authStore: AuthStore,
      private rideService: RideService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRides();
  }

  loadRides(): void {
    const user = this.authStore.currentUser();
    if (user) {
      this.rideService.getDriverRides(user.id).subscribe({
        next: (rides) => {
          this.rides = rides;
        },
        error: (error) => {
          console.error('Error loading rides:', error);
        }
      });
    }
  }

  getStatusLineClass(status: RideStatus): string {
    const baseClasses = 'absolute left-0 top-0 w-1 h-full';
    switch (status) {
      case RideStatus.SCHEDULED:
        return `${baseClasses} bg-gradient-to-b from-green-400 to-green-600`;
      case RideStatus.IN_PROGRESS:
        return `${baseClasses} bg-gradient-to-b from-blue-400 to-blue-600`;
      case RideStatus.COMPLETED:
        return `${baseClasses} bg-gradient-to-b from-gray-400 to-gray-600`;
      case RideStatus.CANCELLED:
        return `${baseClasses} bg-gradient-to-b from-red-400 to-red-600`;
      default:
        return `${baseClasses} bg-gradient-to-b from-gray-400 to-gray-600`;
    }
  }

  navigateToPublishRide(): void {
    this.router.navigate(['/driver/publish-ride']);
  }

  getStatusClass(status: RideStatus): string {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case RideStatus.SCHEDULED:
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`;
      case RideStatus.IN_PROGRESS:
        return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400`;
      case RideStatus.COMPLETED:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300`;
      case RideStatus.CANCELLED:
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300`;
    }
  }

  RideStatus = RideStatus;
}