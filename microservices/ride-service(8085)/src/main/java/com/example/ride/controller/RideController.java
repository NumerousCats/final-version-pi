package com.example.ride.controller;

import com.example.ride.dto.CreateRideRequest;
import com.example.ride.dto.ModifyRideRequest;
import com.example.ride.entities.Ride;
import com.example.ride.service.RideService;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;

    @PostMapping("/create")
    public Ride publishRide(@RequestBody CreateRideRequest request) {
        return rideService.createRide(request);
    }

    @PutMapping("/{rideId}")
    public ResponseEntity<Ride> modifyRide(
            @PathVariable String rideId,
            @RequestBody ModifyRideRequest request) {
        try {
            Ride updatedRide = rideService.modifyRide(rideId, request);
            return ResponseEntity.ok(updatedRide);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }


    @DeleteMapping("/{rideId}")
    public Map<String, String> deleteRide(@PathVariable String rideId, @RequestParam String driverId) {
        rideService.deleteRide(rideId, driverId);
        return Map.of("message", "Ride deleted successfully");
    }


    @GetMapping("/driver/{driverId}")
    public List<Ride> getDriverRides(@PathVariable String driverId) {
        return rideService.getRidesByDriver(driverId);
    }

    @GetMapping
    public List<Ride> getAllRides() {
        return rideService.getAllRides();
    }

    @GetMapping("/search")
    public List<Ride> searchRides(
            @RequestParam(required = false) String departureCity,
            @RequestParam(required = false) String destinationCity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return rideService.searchRides(departureCity, destinationCity, date);
    }

    @GetMapping("/{rideId}")
    public Ride getRideById(@PathVariable String rideId) {
        return rideService.getRideById(rideId);
    }
}