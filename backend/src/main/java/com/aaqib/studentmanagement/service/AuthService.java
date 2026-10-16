package com.aaqib.studentmanagement.service;

import com.aaqib.studentmanagement.dto.request.LoginRequest;
import com.aaqib.studentmanagement.dto.request.RegisterRequest;
import com.aaqib.studentmanagement.dto.response.AuthResponse;
import com.aaqib.studentmanagement.dto.response.UserResponse;
import com.aaqib.studentmanagement.entity.User;
import com.aaqib.studentmanagement.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository repository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dummyPasswordHash = passwordEncoder.encode("unused-login-timing-password");
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (repository.existsByEmailIgnoreCase(email)) {
            throw duplicateEmail();
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        // The client never chooses its own role.
        user.setRole("USER");

        User saved;
        try {
            saved = repository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            // Also handle simultaneous requests registering the same address.
            throw duplicateEmail();
        }
        return jwtService.issue(saved);
    }

    public AuthResponse login(LoginRequest request) {
        User user = repository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElse(null);
        if (user == null) {
            passwordEncoder.matches(request.password(), dummyPasswordHash);
            throw invalidCredentials();
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return jwtService.issue(user);
    }

    public UserResponse currentUser(String subject) {
        long id;
        try {
            id = Long.parseLong(subject);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid access token");
        }
        User user = repository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "This account is no longer available"
        ));
        return UserResponse.from(user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException duplicateEmail() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}
