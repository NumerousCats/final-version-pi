package com.example.ride.service;

import com.example.ride.dto.CreateRideRequest;
import com.example.ride.dto.ModifyRideRequest;
import com.example.ride.entities.Ride;

import java.time.LocalDate;
import java.util.List;

public interface RideService {
    Ride createRide(CreateRideRequest request);
    Ride modifyRide(String rideId, ModifyRideRequest request);
    void deleteRide(String rideId, String driverId);
    List<Ride> getRidesByDriver(String driverId);
    List<Ride> searchRides(String departureCity, String destinationCity, LocalDate date);
    List<Ride> getAllRides();
    Ride getRideById(String rideId);
}