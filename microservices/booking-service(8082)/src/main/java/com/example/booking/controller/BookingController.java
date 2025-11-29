package com.example.booking.controller;

import com.example.booking.dto.CreateBookingRequest;
import com.example.booking.dto.BookingResponse;
import com.example.booking.entities.Booking;
import com.example.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/create")
    public ResponseEntity<BookingResponse> createBooking(@RequestBody CreateBookingRequest request) {
        BookingResponse response = bookingService.bookRide(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable String bookingId,
            @RequestParam String passengerId) {

        bookingService.cancelBooking(bookingId, passengerId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Booking canceled",
                "bookingId", bookingId
        ));
    }

    @GetMapping("/passenger/{passengerId}")
    public ResponseEntity<List<Booking>> getPassengerBookings(@PathVariable String passengerId) {
        List<Booking> bookings = bookingService.getBookingsByPassenger(passengerId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<List<Booking>> getRideBookings(@PathVariable String rideId) {
        List<Booking> bookings = bookingService.getBookingsByRide(rideId);
        return ResponseEntity.ok(bookings);
    }

    @PostMapping("/{bookingId}/accept")
    public ResponseEntity<Map<String, Object>> acceptBooking(
            @PathVariable String bookingId,
            @RequestParam String driverId) {

        bookingService.acceptBooking(bookingId, driverId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Booking accepted",
                "bookingId", bookingId,
                "driverId", driverId
        ));
    }

    @PostMapping("/{bookingId}/reject")
    public ResponseEntity<Map<String, Object>> rejectBooking(
            @PathVariable String bookingId,
            @RequestParam String driverId) {

        bookingService.rejectBooking(bookingId, driverId);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Booking rejected",
                "bookingId", bookingId,
                "driverId", driverId
        ));
    }

    @GetMapping("/driver/{driverId}/pending")
    public ResponseEntity<List<Booking>> getPendingBookings(@PathVariable String driverId) {
        List<Booking> bookings = bookingService.getPendingBookingsByDriver(driverId);
        return ResponseEntity.ok(bookings);
    }
}
