import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { Booking, BookingStatus } from '../models/ride.model';
import { Ride } from '../models/ride.model';
import { environment } from '../../../environments/environment';

/**
 * Backend Booking interface
 */
interface BackendBooking {
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  // Extended backend response with populated data
  ride?: {
    id: string;
    driverId: string;
    departureCity: { name: string; postalCode?: string };
    destinationCity: { name: string; postalCode?: string };
    departureDate: string;
    availableSeats: number;
    totalSeats: number;
    status: string;
  };
  passenger?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
}

interface BackendBookingResponse {
  bookingId: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  status: string;
}

/**
 * Booking Service
 *
 * Handles booking API calls only.
 * Does NOT manage state - use BookingsStore for state management.
 */
@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}${environment.services.bookings}`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new booking
   */
  createBooking(rideId: string, passengerId: string, seatsRequested: number, ride: Ride): Observable<Booking> {
    const request = {
      rideId: rideId,
      passengerId: passengerId,
      seats: seatsRequested
    };

    return this.http.post<BackendBookingResponse>(`${this.apiUrl}/create`, request).pipe(
        map(response => this.mapBackendBookingToFrontend(response, ride)),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to create booking'));
        })
    );
  }

  /**
   * Get bookings by passenger ID
   */
  getPassengerBookings(passengerId: string): Observable<Booking[]> {
    return this.http.get<BackendBooking[]>(`${this.apiUrl}/passenger/${passengerId}`).pipe(
        map(bookings => bookings.map(b => this.mapBackendBookingToFrontend(b))),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to fetch bookings'));
        })
    );
  }

  /**
   * Get booking requests for a driver's rides
   * Now handles populated ride and passenger data from backend
   */
  getDriverBookingRequests(driverId: string): Observable<Booking[]> {
    return this.http.get<BackendBooking[]>(`${this.apiUrl}/driver/${driverId}/pending`).pipe(
        map(bookings => bookings.map(b => this.mapBackendBookingToFrontend(b))),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to fetch booking requests'));
        })
    );
  }

  /**
   * Get all bookings
   */
  getAllBookings(): Observable<Booking[]> {
    return of([]);
  }

  /**
   * Accept a booking
   */
  acceptBooking(bookingId: string, driverId?: string): Observable<Booking> {
    return this.http.post<string>(`${this.apiUrl}/${bookingId}/accept`, null, {
      params: new HttpParams().set('driverId', driverId || '1')
    }).pipe(
        map(() => {
          return {
            id: bookingId,
            rideId: '',
            ride: {} as Ride,
            passengerId: '',
            passenger: {} as any,
            status: BookingStatus.ACCEPTED,
            seatsRequested: 0,
            createdAt: new Date()
          } as Booking;
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to accept booking'));
        })
    );
  }

  /**
   * Reject a booking
   */
  rejectBooking(bookingId: string, driverId?: string): Observable<Booking> {
    return this.http.post<string>(`${this.apiUrl}/${bookingId}/reject`, null, {
      params: new HttpParams().set('driverId', driverId || '1')
    }).pipe(
        map(() => {
          return {
            id: bookingId,
            rideId: '',
            ride: {} as Ride,
            passengerId: '',
            passenger: {} as any,
            status: BookingStatus.REJECTED,
            seatsRequested: 0,
            createdAt: new Date()
          } as Booking;
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to reject booking'));
        })
    );
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: string, passengerId?: string): Observable<void> {
    return this.http.delete<string>(`${this.apiUrl}/${bookingId}`, {
      params: new HttpParams().set('passengerId', passengerId || '1')
    }).pipe(
        map(() => void 0),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to cancel booking'));
        })
    );
  }

  /**
   * Map backend booking to frontend booking
   * Handles both populated and non-populated responses
   */
  private mapBackendBookingToFrontend(backendBooking: BackendBooking | BackendBookingResponse, ride?: Ride): Booking {
    const isResponse = 'bookingId' in backendBooking;
    const booking = backendBooking as BackendBooking;

    return {
      id: isResponse ? (backendBooking as BackendBookingResponse).bookingId : booking.id,
      rideId: backendBooking.rideId,
      ride: booking.ride ? {
        id: booking.ride.id,
        driverId: booking.ride.driverId,
        driver: {} as any,
        departureCity: booking.ride.departureCity.name,
        destinationCity: booking.ride.destinationCity.name,
        departureDate: new Date(booking.ride.departureDate),
        departureTime: '08:00', // Default time if not provided
        availableSeats: booking.ride.availableSeats,
        totalSeats: booking.ride.totalSeats,
        status: booking.ride.status as any,
        passengers: [],
        createdAt: new Date()
      } : (ride || {} as Ride),
      passengerId: backendBooking.passengerId,
      passenger: booking.passenger ? {
        id: booking.passenger.id,
        name: booking.passenger.name,
        email: booking.passenger.email,
        phoneNumber: booking.passenger.phoneNumber,
        password: '',
        role: 'PASSENGER' as any,
        gender: undefined,
        createdAt: new Date()
      } : {} as any,
      status: backendBooking.status as BookingStatus,
      seatsRequested: backendBooking.seatsBooked,
      createdAt: isResponse ? new Date() : new Date(booking.createdAt)
    };
  }
}