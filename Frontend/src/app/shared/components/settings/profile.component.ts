import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/state/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';
import { User } from '../../../core/models/user.model';

@Component({
    selector: 'app-profile-settings',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardComponent,
        ButtonComponent
    ],
    template: `
        <div class="container mx-auto px-4 py-8 max-w-4xl">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings</p>
            </div>

            <!-- Profile Info -->
            <div class="mb-6" *ngIf="currentUser">
                <app-card>
                    <div class="flex items-center space-x-6 mb-6">
                        <div class="h-24 w-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                            {{ getInitials() }}
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {{ currentUser.name }}
                            </h2>
                            <p class="text-gray-600 dark:text-gray-400">
                                {{ getRoleLabel(currentUser.role) }}
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                {{ currentUser.email }}
                            </p>
                        </div>
                    </div>
                </app-card>
            </div>

            <!-- Update Email -->
            <div class="mb-6" *ngIf="currentUser">
                <app-card title="Update Email">
                    <form [formGroup]="emailForm" (ngSubmit)="updateEmail()">
                        <div *ngIf="emailError()" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p class="text-sm text-red-600 dark:text-red-400">{{ emailError() }}</p>
                        </div>
                        <div *ngIf="emailSuccess()" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p class="text-sm text-green-600 dark:text-green-400">Email updated successfully!</p>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Current Email
                                </label>
                                <input
                                        type="text"
                                        [value]="currentUser.email"
                                        disabled
                                        class="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500"
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    New Email *
                                </label>
                                <input
                                        type="email"
                                        formControlName="newEmail"
                                        placeholder="Enter new email"
                                        class="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                                />
                                <p *ngIf="emailForm.get('newEmail')?.invalid && emailForm.get('newEmail')?.touched" class="text-red-500 text-sm mt-1">
                                    Valid email required
                                </p>
                            </div>

                            <div class="mt-6">
                                <app-button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        [disabled]="emailForm.invalid"
                                        [loading]="updatingEmail()"
                                >
                                    Update Email
                                </app-button>
                            </div>
                        </div>
                    </form>
                </app-card>
            </div>

            <!-- Update Password -->
            <div class="mb-6" *ngIf="currentUser">
                <app-card title="Update Password">
                    <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
                        <div *ngIf="passwordError()" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p class="text-sm text-red-600 dark:text-red-400">{{ passwordError() }}</p>
                        </div>
                        <div *ngIf="passwordSuccess()" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p class="text-sm text-green-600 dark:text-green-400">Password updated successfully!</p>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    New Password *
                                </label>
                                <input
                                        type="password"
                                        formControlName="newPassword"
                                        placeholder="Enter new password"
                                        class="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                                />
                                <p *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched" class="text-red-500 text-sm mt-1">
                                    Min 6 characters
                                </p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                        type="password"
                                        formControlName="confirmPassword"
                                        placeholder="Confirm password"
                                        class="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                                />
                                <p *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched" class="text-red-500 text-sm mt-1">
                                    Passwords don't match
                                </p>
                            </div>

                            <div class="mt-6">
                                <app-button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        [disabled]="passwordForm.invalid"
                                        [loading]="updatingPassword()"
                                >
                                    Update Password
                                </app-button>
                            </div>
                        </div>
                    </form>
                </app-card>
            </div>

            <!-- Account Info -->
            <div class="mb-6" *ngIf="currentUser">
                <app-card title="Account Information">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p class="text-sm text-gray-500">User ID</p>
                            <p class="font-medium">{{ currentUser.id }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Account Type</p>
                            <p class="font-medium">{{ getRoleLabel(currentUser.role) }}</p>
                        </div>
                        <div *ngIf="currentUser.phone">
                            <p class="text-sm text-gray-500">Phone</p>
                            <p class="font-medium">{{ currentUser.phone }}</p>
                        </div>
                        <div *ngIf="currentUser.gender">
                            <p class="text-sm text-gray-500">Gender</p>
                            <p class="font-medium">{{ currentUser.gender }}</p>
                        </div>
                    </div>
                </app-card>
            </div>
        </div>
    `,
    styles: []
})
export class ProfileSettingsComponent implements OnInit {
    currentUser: User | null = null;

    emailForm: FormGroup;
    passwordForm: FormGroup;

    updatingEmail = signal(false);
    updatingPassword = signal(false);

    emailError = signal<string | null>(null);
    passwordError = signal<string | null>(null);

    emailSuccess = signal(false);
    passwordSuccess = signal(false);

    constructor(
        public authStore: AuthStore,
        private authService: AuthService,
        private fb: FormBuilder,
        private router: Router
    ) {
        this.emailForm = this.fb.group({
            newEmail: ['', [Validators.required, Validators.email]]
        });

        this.passwordForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void {
        // Get user from authStore or localStorage
        const storeUser = this.authStore.currentUser();
        const storedUser = localStorage.getItem('currentUser');

        if (storeUser) {
            this.currentUser = storeUser;
        } else if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse stored user', e);
                this.router.navigate(['/login']);
            }
        } else {
            // No user found, redirect to login
            this.router.navigate(['/login']);
        }
    }

    passwordMatchValidator(group: FormGroup) {
        const newPass = group.get('newPassword')?.value;
        const confirmPass = group.get('confirmPassword')?.value;
        return newPass === confirmPass ? null : { mismatch: true };
    }

    updateEmail(): void {
        if (this.emailForm.invalid || !this.currentUser?.id) {
            console.error('Form invalid or no user ID', {
                formValid: this.emailForm.valid,
                userId: this.currentUser?.id,
                currentUser: this.currentUser
            });
            return;
        }

        this.updatingEmail.set(true);
        this.emailError.set(null);
        this.emailSuccess.set(false);

        const { newEmail } = this.emailForm.value;

        console.log('Updating email for user:', this.currentUser.id, 'to:', newEmail);

        this.authService.updateEmail(this.currentUser.id, newEmail).subscribe({
            next: (updatedUser) => {
                this.updatingEmail.set(false);
                this.emailSuccess.set(true);
                this.currentUser = updatedUser;

                // Update localStorage
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                this.emailForm.reset();

                // Hide success message after 3 seconds
                setTimeout(() => this.emailSuccess.set(false), 3000);
            },
            error: (err) => {
                this.updatingEmail.set(false);
                this.emailError.set(err.message || 'Failed to update email');

                // Hide error message after 5 seconds
                setTimeout(() => this.emailError.set(null), 5000);
            }
        });
    }

    updatePassword(): void {
        if (this.passwordForm.invalid || !this.currentUser?.id) {
            console.error('Form invalid or no user ID', {
                formValid: this.passwordForm.valid,
                userId: this.currentUser?.id,
                currentUser: this.currentUser
            });
            return;
        }

        this.updatingPassword.set(true);
        this.passwordError.set(null);
        this.passwordSuccess.set(false);

        const { newPassword } = this.passwordForm.value;

        console.log('Updating password for user:', this.currentUser.id);

        this.authService.updatePassword(this.currentUser.id, newPassword).subscribe({
            next: () => {
                this.updatingPassword.set(false);
                this.passwordSuccess.set(true);
                this.passwordForm.reset();

                // Hide success message after 3 seconds
                setTimeout(() => this.passwordSuccess.set(false), 3000);
            },
            error: (err) => {
                this.updatingPassword.set(false);
                this.passwordError.set(err.message || 'Failed to update password');

                // Hide error message after 5 seconds
                setTimeout(() => this.passwordError.set(null), 5000);
            }
        });
    }

    getInitials(): string {
        if (!this.currentUser?.name) return 'U';

        return this.currentUser.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    getRoleLabel(role?: string): string {
        if (!role) return 'User';

        switch (role) {
            case 'DRIVER':
                return 'Driver';
            case 'PASSENGER':
                return 'Passenger';
            case 'ADMIN':
                return 'Administrator';
            default:
                return 'User';
        }
    }
}