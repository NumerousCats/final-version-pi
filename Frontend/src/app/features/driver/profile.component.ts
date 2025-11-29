import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService } from '../../core/services/review.service';
import { ReportService } from '../../core/services/report.service';
import { AuthStore } from '../../core/state/auth.store';
import { User } from '../../core/models/user.model';
import { Review } from '../../core/models/review.model';
import { ReportReason } from '../../core/models/report.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        ReactiveFormsModule,
        CardComponent,
        ButtonComponent,
    ],
    template: `
        <div class="container mx-auto px-4 py-8 max-w-4xl">
            @if (loading) {
                <app-card>
                    <div class="text-center py-12">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p class="text-gray-600 dark:text-gray-400 mt-4">Loading profile...</p>
                    </div>
                </app-card>
            } @else if (user) {

                <!-- USER INFO CARD -->
                <div class="mb-8">
                    <app-card>
                        <div class="flex items-start justify-between mb-6">
                            <div class="flex items-center space-x-4">
                                <div class="h-20 w-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {{ getInitials(user.name) }}
                                </div>
                                <div>
                                    <h1 class="text-3xl font-bold">{{ user.name }}</h1>
                                    <p class="text-gray-600 dark:text-gray-400">{{ getRoleLabel(user.role) }}</p>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                @if (canAddReview()) {
                                    <app-button variant="primary" size="md" (onClick)="openReviewModal()">
                                        Add Review
                                    </app-button>
                                }
                                @if (canReportUser()) {
                                    <button
                                            (click)="openReportModal()"
                                            class="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Report
                                    </button>
                                }
                                <app-button variant="secondary" size="md" (onClick)="goBack()">
                                    ← Back
                                </app-button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <p class="text-sm text-gray-500">Email</p>
                                <p class="font-semibold">{{ user.email }}</p>
                            </div>

                            @if (user.phone) {
                                <div>
                                    <p class="text-sm text-gray-500">Phone</p>
                                    <p class="font-semibold">{{ user.phone }}</p>
                                </div>
                            }

                            <div>
                                <p class="text-sm text-gray-500">Rating</p>
                                <p class="font-semibold">
                                    @if (averageRating !== null && averageRating > 0) {
                                        <span class="text-yellow-500">⭐ {{ averageRating.toFixed(1) }}</span>
                                        <span class="text-sm text-gray-500 ml-2">({{ reviews.length }} reviews)</span>
                                    } @else {
                                        <span class="text-gray-500">No ratings yet</span>
                                    }
                                </p>
                            </div>
                        </div>
                    </app-card>
                </div>

                <!-- REVIEWS SECTION -->
                <app-card>
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold">Reviews</h2>
                    </div>

                    @if (filteredReviews.length > 0) {
                        <div class="space-y-6">
                            @for (review of filteredReviews; track review.id) {
                                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <div class="flex items-start justify-between mb-2">
                                        <div>
                                            <p class="font-semibold">{{ getReviewerName(review) }}</p>
                                            <p class="text-sm text-gray-500">
                                                {{ review.createdAt | date:'MMM d, yyyy' }}
                                            </p>
                                        </div>

                                        <div class="flex items-center space-x-1">
                                            @for (i of [1,2,3,4,5]; track i) {
                                                <svg
                                                        class="h-5 w-5"
                                                        [ngClass]="i <= review.rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                </svg>
                                            }
                                        </div>
                                    </div>

                                    @if (review.comment) {
                                        <p class="text-gray-700 dark:text-gray-300 mt-2">{{ review.comment }}</p>
                                    }
                                </div>
                            }
                        </div>

                    } @else {
                        <div class="text-center py-12">
                            <p class="text-gray-500">No reviews yet</p>
                        </div>
                    }
                </app-card>

            } @else {
                <app-card>
                    <div class="text-center py-12">
                        <p class="text-red-600 text-lg font-semibold">User not found</p>
                        <app-button variant="primary" (onClick)="goBack()" class="mt-4">
                            Go Back
                        </app-button>
                    </div>
                </app-card>
            }

            <!-- REVIEW MODAL -->
            @if (showReviewModal) {
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">

                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold">Add Review</h3>
                            <button (click)="closeReviewModal()" class="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Rating</label>
                                <div class="flex space-x-2">
                                    @for (star of [1,2,3,4,5]; track star) {
                                        <button
                                                type="button"
                                                (click)="setRating(star)"
                                                class="cursor-pointer hover:scale-110 transition"
                                        >
                                            <svg
                                                    class="h-8 w-8"
                                                    [ngClass]="star <= currentRating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                        </button>
                                    }
                                </div>
                                @if (reviewForm.get('rating')?.invalid && reviewForm.get('rating')?.touched) {
                                    <p class="text-red-500 text-sm mt-1">Please select a rating</p>
                                }
                            </div>

                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2">Comment</label>
                                <textarea
                                        formControlName="comment"
                                        rows="4"
                                        placeholder="Share your experience..."
                                        class="w-full px-4 py-2 border rounded-lg"
                                ></textarea>
                            </div>

                            <div class="flex gap-3">
                                <app-button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        [fullWidth]="true"
                                        [disabled]="reviewForm.invalid || submittingReview"
                                >
                                    Submit
                                </app-button>

                                <app-button
                                        type="button"
                                        variant="secondary"
                                        size="lg"
                                        (onClick)="closeReviewModal()"
                                >
                                    Cancel
                                </app-button>
                            </div>
                        </form>
                    </div>
                </div>
            }

            <!-- REPORT MODAL -->
            @if (showReportDialog()) {
                <div class="fixed inset-0 z-50 overflow-y-auto">
                    <div class="fixed inset-0 bg-black bg-opacity-50" (click)="closeReportModal()"></div>

                    <div class="flex min-h-full items-center justify-center p-4">
                        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">

                            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <div class="mt-4 text-center">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Report User</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Please provide details about why you're reporting {{ user?.name }}
                                </p>
                            </div>

                            <form [formGroup]="reportForm" (ngSubmit)="submitReport()">
                                <!-- Error Message -->
                                @if (errorMessage) {
                                    <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
                                    </div>
                                }

                                <!-- Reason Selection -->
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Reason *
                                    </label>
                                    <select
                                            formControlName="reason"
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="INAPPROPRIATE_BEHAVIOR">Inappropriate Behavior</option>
                                        <option value="UNSAFE_DRIVING">Unsafe Driving</option>
                                        <option value="HARASSMENT">Harassment</option>
                                        <option value="FRAUD">Fraud</option>
                                        <option value="NO_SHOW">No Show</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                    @if (reportForm.get('reason')?.invalid && reportForm.get('reason')?.touched) {
                                        <p class="text-red-500 text-sm mt-1">Please select a reason</p>
                                    }
                                </div>

                                <!-- Description -->
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                            formControlName="description"
                                            rows="4"
                                            placeholder="Provide details about the issue..."
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    ></textarea>
                                    @if (reportForm.get('description')?.invalid && reportForm.get('description')?.touched) {
                                        <p class="text-red-500 text-sm mt-1">Please provide a description (min 20 characters)</p>
                                    }
                                </div>

                                <div class="flex gap-3">
                                    <app-button
                                            type="button"
                                            variant="secondary"
                                            size="md"
                                            (onClick)="closeReportModal()"
                                            [disabled]="submittingReport()"
                                            [fullWidth]="true"
                                    >
                                        Cancel
                                    </app-button>

                                    <app-button
                                            type="submit"
                                            variant="danger"
                                            size="md"
                                            [loading]="submittingReport()"
                                            [disabled]="reportForm.invalid"
                                            [fullWidth]="true"
                                    >
                                        Submit Report
                                    </app-button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            }

            <!-- SUCCESS MESSAGES -->
            @if (showSuccessMessage) {
                <div class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    ✓ Review added successfully!
                </div>
            }

            @if (showReportSuccess()) {
                <div class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    ✓ Report submitted successfully!
                </div>
            }

        </div>
    `
})
export class UserProfileComponent implements OnInit {
    user: User | null = null;
    reviews: Review[] = [];
    filteredReviews: Review[] = [];
    averageRating: number | null = null;
    loading = true;

    showReviewModal = false;
    reviewForm: FormGroup;
    submittingReview = false;
    showSuccessMessage = false;
    errorMessage: string | null = null;

    currentRating = 0;

    // Report functionality
    showReportDialog = signal(false);
    reportForm: FormGroup;
    submittingReport = signal(false);
    showReportSuccess = signal(false);
    ReportReason = ReportReason;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private reviewService: ReviewService,
        private reportService: ReportService,
        private authStore: AuthStore,
        private fb: FormBuilder
    ) {
        this.reviewForm = this.fb.group({
            rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
            comment: ['', [Validators.required, Validators.minLength(10)]]
        });

        this.reportForm = this.fb.group({
            reason: ['', [Validators.required]],
            description: ['', [Validators.required, Validators.minLength(20)]]
        });
    }

    ngOnInit(): void {
        const userId = this.route.snapshot.paramMap.get('id');
        if (userId) this.loadUserProfile(userId);
        else this.loading = false;
    }

    loadUserProfile(id: string): void {
        this.loading = true;
        this.authService.getUserById(id).subscribe({
            next: user => {
                this.user = user;
                this.loadUserReviews(id);
            },
            error: () => (this.loading = false)
        });
    }

    loadUserReviews(id: string): void {
        this.reviewService.getUserReviews(id).subscribe({
            next: reviews => {
                this.reviews = reviews;
                this.filteredReviews = reviews;
                this.loadReviewerDetails();
                this.loadAverageRating(id);
            },
            error: () => (this.loading = false)
        });
    }

    loadReviewerDetails(): void {
        this.filteredReviews.forEach(review => {
            this.authService.getUserById(review.reviewerId).subscribe({
                next: user => {
                    review.reviewer = user;
                },
                error: () => {
                    console.error(`Failed to load reviewer with ID: ${review.reviewerId}`);
                }
            });
        });
    }

    loadAverageRating(id: string): void {
        this.reviewService.getAverageRating(id).subscribe({
            next: rating => {
                this.averageRating = rating;
                this.loading = false;
            },
            error: () => {
                this.averageRating = 0;
                this.loading = false;
            }
        });
    }

    openReviewModal(): void {
        this.showReviewModal = true;
        this.currentRating = 0;
        this.reviewForm.reset({ rating: 0, comment: '' });
    }

    closeReviewModal(): void {
        this.showReviewModal = false;
        this.currentRating = 0;
        this.reviewForm.reset();
    }

    setRating(rating: number): void {
        this.currentRating = rating;
        this.reviewForm.patchValue({ rating });
    }

    submitReview(): void {
        if (this.reviewForm.invalid || !this.user) return;

        const currentUser = this.authStore.currentUser();
        if (!currentUser) return;

        const reviewData = {
            reviewerId: currentUser.id,
            reviewedId: this.user.id,
            rating: this.reviewForm.value.rating,
            comment: this.reviewForm.value.comment,
            type: currentUser.role === 'DRIVER' ? 'DRIVER' : 'PASSENGER'
        };

        this.submittingReview = true;

        this.reviewService.createReview(reviewData).subscribe({
            next: () => {
                this.submittingReview = false;
                this.closeReviewModal();
                this.showSuccessMessage = true;
                this.loadUserReviews(this.user!.id);
                setTimeout(() => (this.showSuccessMessage = false), 3000);
            },
            error: () => {
                this.submittingReview = false;
            }
        });
    }

    openReportModal(): void {
        this.showReportDialog.set(true);
        this.reportForm.reset();
        this.errorMessage = null;
    }

    closeReportModal(): void {
        this.showReportDialog.set(false);
        this.reportForm.reset();
        this.errorMessage = null;
    }

    submitReport(): void {
        if (this.reportForm.invalid || !this.user) return;

        const currentUser = this.authStore.currentUser();
        if (!currentUser) return;

        const reportData = {
            reporterId: currentUser.id,
            reportedUserId: this.user.id,
            reason: this.reportForm.value.reason,
            description: this.reportForm.value.description
        };

        this.submittingReport.set(true);
        this.errorMessage = null;

        this.reportService.createReport(reportData).subscribe({
            next: () => {
                this.submittingReport.set(false);
                this.closeReportModal();
                this.showReportSuccess.set(true);
                setTimeout(() => this.showReportSuccess.set(false), 3000);
            },
            error: (error) => {
                console.error('Failed to submit report:', error);
                this.submittingReport.set(false);
                this.errorMessage = error.message || 'Failed to submit report. Please try again.';
            }
        });
    }

    getReviewerName(review: Review): string {
        return review.reviewer?.name || review.reviewer?.email || `User ${review.reviewerId}`;
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    getRoleLabel(role: string): string {
        return role === 'DRIVER' ? 'Driver'
            : role === 'PASSENGER' ? 'Passenger'
                : role === 'ADMIN' ? 'Administrator'
                    : role;
    }

    canAddReview(): boolean {
        const cur = this.authStore.currentUser();
        return !!cur && this.user?.id !== cur.id;
    }

    canReportUser(): boolean {
        const cur = this.authStore.currentUser();
        return !!cur && this.user?.id !== cur.id;
    }

    goBack(): void {
        window.history.back();
    }
}