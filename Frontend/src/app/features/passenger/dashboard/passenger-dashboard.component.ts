import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/state/auth.store';
import { RideService } from '../../../core/services/ride.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ride } from '../../../core/models/ride.model';
import { User } from '../../../core/models/user.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { forkJoin } from 'rxjs';

/**
 * Passenger Dashboard component
 * Main dashboard for passengers with:
 * - Auto-loaded rides on init
 * - Search ride form with filters (date, departure, destination, gender)
 * - Ride results with driver info and booking button
 */
@Component({
  selector: 'app-passenger-dashboard',
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
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Find Your Ride, {{ authStore.currentUser()?.name }}!
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Search for available rides to your destination
        </p>
      </div>

      <!-- Search Form -->
      <app-card class="mb-8">
        <form [formGroup]="searchForm" (ngSubmit)="searchRides()">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <app-input
                id="departureCity"
                label="From"
                type="text"
                placeholder="Tunis"
                formControlName="departureCity"
            />

            <app-input
                id="destinationCity"
                label="To"
                type="text"
                placeholder="Sfax"
                formControlName="destinationCity"
            />

            <app-input
                id="date"
                label="Date"
                type="date"
                formControlName="date"
            />

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Driver Gender
              </label>
              <select
                  formControlName="gender"
                  class="input-field"
              >
                <option value="">Any</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div class="flex gap-4">
            <app-button
                type="submit"
                variant="primary"
                size="lg"
                [fullWidth]="true"
            >
              <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Rides
            </app-button>

            @if (searchForm.value.departureCity || searchForm.value.destinationCity || searchForm.value.date || searchForm.value.gender) {
              <app-button
                  type="button"
                  variant="secondary"
                  size="lg"
                  (onClick)="clearFilters()"
              >
                Clear Filters
              </app-button>
            }
          </div>
        </form>
      </app-card>

      <!-- Loading State -->
      @if (loading) {
        <app-card>
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p class="text-gray-600 dark:text-gray-400 mt-4">Loading rides...</p>
          </div>
        </app-card>
      }

      <!-- Ride Results -->
      @if (!loading) {
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Available Rides ({{ rides.length }})
          </h2>

          @if (rides.length > 0) {
            <div class="grid grid-cols-1 gap-6">
              @for (ride of rides; track ride.id) {
                <app-card>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-4 mb-4">
                        <button
                            (click)="viewDriverProfile(ride.driverId)"
                            class="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold hover:bg-primary-700 transition-colors cursor-pointer"
                        >
                          {{ getInitials(getDriverName(ride.driverId)) }}
                        </button>
                        <div>
                          <button
                              (click)="viewDriverProfile(ride.driverId)"
                              class="text-lg font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-colors text-left"
                          >
                            {{ getDriverName(ride.driverId) }}
                            @if (getDriverInfo(ride.driverId)?.rating) {
                              <span class="text-sm text-yellow-500 ml-2">
                                ⭐ {{ getDriverInfo(ride.driverId)?.rating?.toFixed(1) }}
                              </span>
                            }
                          </button>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ getDriverRideCount(ride.driverId) }} rides
                          </p>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                          <p class="text-sm text-gray-500 dark:text-gray-400">Available Seats</p>
                          <p class="font-semibold text-gray-900 dark:text-gray-100">
                            {{ ride.availableSeats }} seat(s)
                          </p>
                        </div>
                      </div>

                      @if (getDriverInfo(ride.driverId)?.vehicle) {
                        <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            <span class="font-medium">Vehicle:</span>
                            {{ getDriverInfo(ride.driverId)?.vehicle?.brand }} {{ getDriverInfo(ride.driverId)?.vehicle?.model }}
                            ({{ getDriverInfo(ride.driverId)?.vehicle?.color }})
                          </p>
                        </div>
                      }
                    </div>

                    <div class="ml-6 text-right">
                      <app-button
                          variant="primary"
                          size="lg"
                          (onClick)="bookRide(ride)"
                      >
                        Book Ride
                      </app-button>
                    </div>
                  </div>
                </app-card>
              }
            </div>
          } @else {
            <app-card>
              <div class="text-center py-12">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-gray-600 dark:text-gray-400">No rides found for your search criteria</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adjusting your filters</p>
              </div>
            </app-card>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class PassengerDashboardComponent implements OnInit {
  searchForm: FormGroup;
  rides: Ride[] = [];
  loading = false;
  driverCache: Map<string, User> = new Map();
  driverRideCountCache: Map<string, number> = new Map();

  constructor(
      public authStore: AuthStore,
      private fb: FormBuilder,
      private rideService: RideService,
      private authService: AuthService,
      private router: Router
  ) {
    this.searchForm = this.fb.group({
      departureCity: [''],
      destinationCity: [''],
      date: [''],
      gender: ['']
    });
  }

  ngOnInit(): void {
    // Load all rides on initialization
    this.loadAllRides();
  }

  loadAllRides(): void {
    this.loading = true;
    const passenger = this.authStore.currentUser();

    this.rideService.searchRides({
      passengerGender: passenger?.gender
    }).subscribe({
      next: (rides) => {
        this.rides = rides;
        this.loadDriversForRides(rides);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rides:', error);
        this.loading = false;
      }
    });
  }

  searchRides(): void {
    this.loading = true;
    const formValue = this.searchForm.value;
    const passenger = this.authStore.currentUser();

    this.rideService.searchRides({
      departureCity: formValue.departureCity || undefined,
      destinationCity: formValue.destinationCity || undefined,
      date: formValue.date ? new Date(formValue.date) : undefined,
      gender: formValue.gender || undefined,
      passengerGender: passenger?.gender
    }).subscribe({
      next: (rides) => {
        this.rides = rides;
        this.loadDriversForRides(rides);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching rides:', error);
        this.loading = false;
      }
    });
  }

  clearFilters(): void {
    this.searchForm.reset({
      departureCity: '',
      destinationCity: '',
      date: '',
      gender: ''
    });
    this.loadAllRides();
  }

  loadDriversForRides(rides: Ride[]): void {
    // Get unique driver IDs that aren't already cached
    const driverIds = [...new Set(rides.map(r => r.driverId))]
        .filter(id => !this.driverCache.has(id));

    if (driverIds.length === 0) return;

    // Load all drivers and their ride counts in parallel
    const driverRequests = driverIds.map(id =>
        this.authService.getUserById(id)
    );

    const rideCountRequests = driverIds.map(id =>
        this.rideService.getDriverRides(id)
    );

    forkJoin([
      forkJoin(driverRequests),
      forkJoin(rideCountRequests)
    ]).subscribe({
      next: ([drivers, rideCounts]) => {
        drivers.forEach((driver, index) => {
          this.driverCache.set(driverIds[index], driver);
        });
        rideCounts.forEach((rides, index) => {
          this.driverRideCountCache.set(driverIds[index], rides.length);
        });
      },
      error: (error) => {
        console.error('Error loading drivers:', error);
      }
    });
  }

  getDriverName(driverId: string): string {
    const driver = this.driverCache.get(driverId);
    return driver?.name || driver?.email?.split('@')[0] || 'Loading...';
  }

  getDriverInfo(driverId: string): User | undefined {
    return this.driverCache.get(driverId);
  }

  getDriverRideCount(driverId: string): number {
    return this.driverRideCountCache.get(driverId) || 0;
  }

  viewDriverProfile(driverId: string): void {
    this.router.navigate(['/profile', driverId]);
  }

  bookRide(ride: Ride): void {
    // Navigate to booking page or open booking modal
    this.router.navigate(['/passenger/book-ride', ride.id]);
  }

  getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
  }
}