package com.example.authentication.controller;

import com.example.authentication.dto.CreateAccountRequest;
import com.example.authentication.entities.AppUser;
import com.example.authentication.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/createAccount")
    public ResponseEntity<Map<String, Object>> createAccount(@RequestBody CreateAccountRequest request) {
        AppUser user = authenticationService.createAccount(request);

        String token = "jwt-token-" + user.getId();

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("token", token);
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/authenticate")
    public ResponseEntity<Map<String, Object>> authenticate(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        boolean success = authenticationService.authenticate(email, password);
        if (success) {
            AppUser user = authenticationService.getUserByEmail(email);
            String token = "jwt-token-" + user.getId();

            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("token", token);
            response.put("status", "success");

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(Map.of("status", "failure"));
        }
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable String userId) {
        try {
            AppUser user = authenticationService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/users")
    public List<AppUser> getAllUsers() {
        return authenticationService.getAllUsers();
    }

    @GetMapping("/users/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        try {
            AppUser user = authenticationService.getUserByEmail(email);
            return ResponseEntity.ok(user);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/ban")
    public AppUser banUser(@PathVariable String userId) {
        return authenticationService.banUser(userId);
    }

    @PutMapping("/users/{userId}/unban")
    public AppUser unbanUser(@PathVariable String userId) {
        return authenticationService.unbanUser(userId);
    }

    @PutMapping("/users/{userId}/email")
    public ResponseEntity<?> updateEmail(@PathVariable String userId, @RequestBody Map<String, String> payload) {
        try {
            String newEmail = payload.get("email");
            AppUser updatedUser = authenticationService.updateEmail(userId, newEmail);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(400).body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/password")
    public ResponseEntity<?> updatePassword(@PathVariable String userId, @RequestBody Map<String, String> payload) {
        try {
            String newPassword = payload.get("password");
            AppUser updatedUser = authenticationService.updatePassword(userId, newPassword);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(400).body(Map.of("error", ex.getMessage()));
        }
    }
}
