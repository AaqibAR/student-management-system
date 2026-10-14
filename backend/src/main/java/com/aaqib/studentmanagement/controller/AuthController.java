package com.aaqib.studentmanagement.controller;

import com.aaqib.studentmanagement.dto.request.LoginRequest;
import com.aaqib.studentmanagement.dto.request.RegisterRequest;
import com.aaqib.studentmanagement.dto.response.AuthResponse;
import com.aaqib.studentmanagement.dto.response.UserResponse;
import com.aaqib.studentmanagement.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(service.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(service.currentUser(jwt.getSubject()));
    }
}
