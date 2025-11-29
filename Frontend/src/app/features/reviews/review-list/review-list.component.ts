import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { Review } from '../../../core/models/review.model';
import { User } from '../../../core/models/user.model';
import { CardComponent } from '../../../shared/components/card/card.component';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-review-list',
    standalone: true,
    imports: [CommonModule, CardComponent],
    template: `
        <app-card title="Reviews">
            @if (loading) {
                <div class="flex justify-center items-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            } @else if (error) {
                <div class="text-center py-8 text-red-600 dark:text-red-400">
                    {{ error }}
                </div>
            } @else if (reviews.length === 0) {
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No reviews yet
                </div>
            } @else {
                <div class="space-y-4">
                    @for (review of reviews; track review.id) {
                        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <!-- Reviewer Info -->
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center space-x-3">
                                    <!-- Avatar -->
                                    <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span class="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                                            {{ getReviewerInitials(review.reviewerId) }}
                                        </span>
                                    </div>
                                    <div>
                                        <!-- Reviewer Name -->
                                        <p class="font-semibold text-gray-900 dark:text-gray-100">
                                            {{ getReviewerName(review.reviewerId) }}
                                        </p>
                                        <!-- Stars -->
                                        <div class="flex items-center mt-1">
                                            @for (star of [1,2,3,4,5]; track star) {
                                                <svg
                                                        class="w-4 h-4"
                                                        [class.text-yellow-400]="star <= review.rating"
                                                        [class.text-gray-300]="star > review.rating"
                                                        [class.dark:text-gray-600]="star > review.rating"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            }
                                            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                                {{ review.rating }}/5
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <!-- Date -->
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ formatDate(review.createdAt) }}
                                </span>
                            </div>

                            <!-- Review Comment -->
                            @if (review.comment) {
                                <p class="text-gray-700 dark:text-gray-300 pl-13">
                                    {{ review.comment }}
                                </p>
                            }
                        </div>
                    }
                </div>

                <!-- Summary Stats -->
                <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-2">
                        <svg class="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {{ getAverageRating() }}
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                            ({{ reviews.length }} {{ reviews.length === 1 ? 'review' : 'reviews' }})
                        </span>
                    </div>
                </div>
            }
        </app-card>
    `,
    styles: []
})
export class ReviewListComponent implements OnInit, OnChanges {

    @Input() userId?: string;

    reviews: Review[] = [];
    loading = false;
    error = '';

    reviewerCache: Map<string, User> = new Map(); // Store full User object

    constructor(
        private reviewService: ReviewService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        if (this.userId) this.loadReviews();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['userId'] && !changes['userId'].firstChange) {
            this.loadReviews();
        }
    }

    loadReviews(): void {
        if (!this.userId) return;

        this.loading = true;
        this.error = '';

        this.reviewService.getUserReviews(this.userId).subscribe({
            next: (reviews) => {
                this.reviews = reviews;
                this.loading = false;
                this.loadReviewerNames(reviews);
            },
            error: (err) => {
                console.error(err);
                this.error = 'Failed to load reviews';
                this.loading = false;
            }
        });
    }

    loadReviewerNames(reviews: Review[]): void {
        const reviewerIds = [
            ...new Set(reviews.map(r => r.reviewerId))
        ].filter(id => !this.reviewerCache.has(id));

        if (reviewerIds.length === 0) return;

        const requests = reviewerIds.map(id => this.authService.getUserById(id));

        forkJoin(requests).subscribe({
            next: (users) => {
                users.forEach((user, index) => {
                    this.reviewerCache.set(reviewerIds[index], user);
                });
            },
            error: (err) => console.error('Error loading reviewers:', err)
        });
    }

    getReviewerName(id: string): string {
        const user = this.reviewerCache.get(id);
        return user?.name || user?.email?.split('@')[0] || 'Loading...';
    }

    getReviewerInitials(id: string): string {
        const user = this.reviewerCache.get(id);
        if (!user?.name) return '?';

        const nameParts = user.name.split(' ');
        if (nameParts.length >= 2) {
            return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        return user.name[0].toUpperCase();
    }

    getAverageRating(): string {
        if (this.reviews.length === 0) return 'N/A';

        const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        const avg = total / this.reviews.length;
        return avg.toFixed(1);
    }

    formatDate(date: Date | string): string {
        const d = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

        return d.toLocaleDateString();
    }
}