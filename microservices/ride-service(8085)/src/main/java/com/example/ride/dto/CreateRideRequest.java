package com.example.ride.dto;

import com.example.ride.entities.City;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateRideRequest {
    private City departureCity;
    private City destinationCity;
    private LocalDate departureDate;
    private Integer availableSeats;
    private Integer totalSeats;
    private Double pricePerSeat;
    private String driverId;
}
