import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Review } from '../models/review.model';
import { environment } from '../../../environments/environment';

/**
 * Backend Review interface - matches MongoDB structure
 */
interface BackendReview {
  id: string;
  reviewerId: string;
  reviewedId: string;
  rideId?: string;
  rating: number;
  comment: string;
  type: 'DRIVER' | 'PASSENGER';
  createdAt: string;
}

/**
 * Backend CreateReviewRequest
 */
interface BackendCreateReviewRequest {
  reviewerId: string;
  reviewedId: string;
  rideId?: string;
  rating: number;
  comment: string;
  type: 'DRIVER' | 'PASSENGER';
}

/**
 * Review service - manages reviews and ratings
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}${environment.services.reviews}`;

  constructor(private http: HttpClient) { }

  /**
   * Create a new review
   */
  createReview(reviewData: Partial<Review>): Observable<Review> {
    const request: BackendCreateReviewRequest = {
      reviewerId: reviewData.reviewerId || '',
      reviewedId: reviewData.reviewedId || '',
      rideId: reviewData.rideId || undefined,
      rating: reviewData.rating || 0,
      comment: reviewData.comment || '',
      type: (reviewData as any).type || 'PASSENGER'
    };

    return this.http.post<BackendReview>(`${this.apiUrl}/create`, request).pipe(
        map(backendReview => this.mapBackendReviewToFrontend(backendReview)),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to create review'));
        })
    );
  }

  /**
   * Get reviews for a user
   */
  getUserReviews(userId: string): Observable<Review[]> {
    return this.http.get<BackendReview[]>(`${this.apiUrl}/user/${userId}`).pipe(
        map(reviews => reviews.map(r => this.mapBackendReviewToFrontend(r))),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to fetch reviews'));
        })
    );
  }

  /**
   * Get reviews for a user by type
   */
  getUserReviewsByType(userId: string, type: 'DRIVER' | 'PASSENGER'): Observable<Review[]> {
    return this.http.get<BackendReview[]>(`${this.apiUrl}/user/${userId}/type/${type}`).pipe(
        map(reviews => reviews.map(r => this.mapBackendReviewToFrontend(r))),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to fetch reviews by type'));
        })
    );
  }

  /**
   * Get reviews for a ride
   */
  getRideReviews(rideId: string): Observable<Review[]> {
    return this.http.get<BackendReview[]>(`${this.apiUrl}/ride/${rideId}`).pipe(
        map(reviews => reviews.map(r => this.mapBackendReviewToFrontend(r))),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to fetch ride reviews'));
        })
    );
  }

  /**
   * Calculate average rating for a user
   */
  getAverageRating(userId: string): Observable<number> {
    return this.http.get<{ userId: string; averageRating: number }>(`${this.apiUrl}/user/${userId}/average`).pipe(
        map(response => response.averageRating || 0),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Failed to get average rating'));
        })
    );
  }

  /**
   * Map backend review to frontend review
   */
  private mapBackendReviewToFrontend(backendReview: BackendReview): Review {
    return {
      id: backendReview.id,
      reviewerId: backendReview.reviewerId,
      reviewer: {} as any, // Will be populated separately if needed
      reviewedId: backendReview.reviewedId,
      reviewed: {} as any, // Will be populated separately if needed
      rideId: backendReview.rideId || '',
      rating: backendReview.rating,
      comment: backendReview.comment,
      createdAt: new Date(backendReview.createdAt)
    };
  }
}