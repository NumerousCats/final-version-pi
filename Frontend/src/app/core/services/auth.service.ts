import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { User, UserRole, Gender, AuthResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface BackendAppUser {
    id: string;
    email: string;
    password?: string;
    phoneNumber: string;
    gender: 'MALE' | 'FEMALE';
    userType: 'PASSENGER' | 'DRIVER' | 'ADMIN';
    createdAt: string;
    updatedAt?: string;
    isBanned?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}${environment.services.auth}`;

    constructor(private http: HttpClient) {}

    // ------------------------------
    // LOGIN
    // ------------------------------
    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<any>(`${this.apiUrl}/authenticate`, { email, password }).pipe(
            map((response: any) => {
                if (response.status !== 'success') {
                    throw new Error('Authentication failed');
                }
                const user = this.mapBackendUserToFrontend(response.user);
                return {
                    user,
                    token: response.token
                };
            }),
            catchError(error => throwError(() => new Error(error.error?.message || 'Login failed')))
        );
    }

    // ------------------------------
    // REGISTER
    // ------------------------------
    register(userData: any): Observable<AuthResponse> {
        const request = {
            email: userData.email,
            password: userData.password,
            phoneNumber: userData.phone,
            gender: userData.gender || 'MALE',
            userType: userData.role === UserRole.ADMIN ? 'ADMIN' : userData.role,
            licenseNumber: userData.cin || '',
            vehicleNumber: userData.vehicle?.model || '',
            vehiclePlate: userData.vehicle?.licensePlate || '',
            preferredPaymentMethod: ''
        };

        return this.http.post<any>(`${this.apiUrl}/createAccount`, request).pipe(
            map(response => {
                if (response.status !== 'success' && !response.user) {
                    throw new Error(response.message || 'Registration failed');
                }

                const user = this.mapBackendUserToFrontend(response.user);

                return {
                    user,
                    token: response.token
                };
            }),
            catchError(err => {
                let msg = 'Registration failed';

                if (err.error?.message) msg = err.error.message;
                if (err.status === 500 && err.error?.message) msg = err.error.message;
                if (err.status === 400) msg = 'Invalid registration data';

                return throwError(() => new Error(msg));
            })
        );
    }

    // ------------------------------
    // GET USER BY EMAIL
    // ------------------------------
    getUserByEmail(email: string): Observable<User> {
        return this.http.get<BackendAppUser>(`${this.apiUrl}/users/email/${encodeURIComponent(email)}`).pipe(
            map(u => this.mapBackendUserToFrontend(u)),
            catchError(error => throwError(() => new Error(error.error?.message || 'Failed to get user')))
        );
    }


    getUserById(id: string): Observable<User> {
        return this.http.get<BackendAppUser>(`${this.apiUrl}/users/${id}`).pipe(
            map(u => this.mapBackendUserToFrontend(u)),
            catchError(error => throwError(() => new Error(error.error?.message || 'Failed to get user')))
        );
    }

    getAllUsers(): Observable<User[]> {
        return this.http.get<BackendAppUser[]>(`${this.apiUrl}/users`).pipe(
            map(users => users.map(u => this.mapBackendUserToFrontend(u))),
            catchError(error => throwError(() => new Error(error.error?.message || 'Failed to get users')))
        );
    }


    banUser(userId: string): Observable<User> {
        return this.http.put<BackendAppUser>(`${this.apiUrl}/users/${userId}/ban`, {}).pipe(
            map(u => this.mapBackendUserToFrontend(u)),
            catchError(error => throwError(() => new Error(error.error?.message || 'Failed to ban user')))
        );
    }


    unbanUser(userId: string): Observable<User> {
        return this.http.put<BackendAppUser>(`${this.apiUrl}/users/${userId}/unban`, {}).pipe(
            map(u => this.mapBackendUserToFrontend(u)),
            catchError(error => throwError(() => new Error(error.error?.message || 'Failed to unban user')))
        );
    }

    // =====================================================================
    // updateEmail & updatePassword
    // =====================================================================

    /**
     * Update user email
     */
    updateEmail(userId: string, newEmail: string): Observable<User> {
        return this.http.put<BackendAppUser>(
            `${this.apiUrl}/users/${userId}/email`,
            { email: newEmail }
        ).pipe(
            map(u => this.mapBackendUserToFrontend(u)),
            catchError(error =>
                throwError(() => new Error(error.error?.message || 'Failed to update email'))
            )
        );
    }

    /**
     * Update user password
     */
    updatePassword(userId: string, newPassword: string): Observable<User> {
        return this.http.put<BackendAppUser>(
            `${this.apiUrl}/users/${userId}/password`,
            { password: newPassword }
        ).pipe(
            map(u => this.mapBackendUserToFrontend(u)),
            catchError(error =>
                throwError(() => new Error(error.error?.message || 'Failed to update password'))
            )
        );
    }

    // =====================================================================
    // INTERNAL MAPPER
    // =====================================================================
    private mapBackendUserToFrontend(backendUser: BackendAppUser): User {
        return {
            id: backendUser.id,
            name: backendUser.email.split('@')[0],
            email: backendUser.email,
            phone: backendUser.phoneNumber,
            role: backendUser.userType === 'ADMIN'
                ? UserRole.ADMIN
                : backendUser.userType === 'DRIVER'
                    ? UserRole.DRIVER
                    : UserRole.PASSENGER,
            gender: backendUser.gender === 'MALE' ? Gender.MALE : Gender.FEMALE,
            createdAt: new Date(backendUser.createdAt),
            isBanned: backendUser.isBanned || false
        };
    }
}
