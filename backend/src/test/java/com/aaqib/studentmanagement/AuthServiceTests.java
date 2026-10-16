package com.aaqib.studentmanagement;

import com.aaqib.studentmanagement.config.PasswordConfig;
import com.aaqib.studentmanagement.dto.request.LoginRequest;
import com.aaqib.studentmanagement.dto.request.RegisterRequest;
import com.aaqib.studentmanagement.dto.response.AuthResponse;
import com.aaqib.studentmanagement.dto.response.UserResponse;
import com.aaqib.studentmanagement.entity.User;
import com.aaqib.studentmanagement.repository.UserRepository;
import com.aaqib.studentmanagement.service.AuthService;
import com.aaqib.studentmanagement.service.JwtService;
import jakarta.validation.Validation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTests {
    private UserRepository repository;
    private JwtService jwtService;
    private PasswordEncoder encoder;
    private AuthService service;

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        jwtService = mock(JwtService.class);
        encoder = new PasswordConfig().passwordEncoder();
        service = new AuthService(repository, encoder, jwtService);
    }

    @Test
    void registrationNormalizesEmailAndStoresHashWithUserRole() {
        when(repository.saveAndFlush(any())).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 1L);
            assertEquals("Aaqib", user.getName());
            assertEquals("aaqib@example.com", user.getEmail());
            assertEquals("USER", user.getRole());
            assertNotEquals("password123", user.getPasswordHash());
            assertTrue(encoder.matches("password123", user.getPasswordHash()));
            return user;
        });
        service.register(new RegisterRequest(" Aaqib ", "Aaqib@Example.com", "password123"));
        verify(jwtService).issue(any(User.class));
    }

    @Test
    void duplicateRegistrationReturnsConflictBeforeSaving() {
        when(repository.existsByEmailIgnoreCase("aaqib@example.com")).thenReturn(true);
        var error = assertThrows(ResponseStatusException.class, () ->
                service.register(new RegisterRequest("Aaqib", "aaqib@example.com", "password123")));
        assertEquals(409, error.getStatusCode().value());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void concurrentDuplicateRegistrationReturnsConflict() {
        when(repository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("unique"));
        var error = assertThrows(ResponseStatusException.class, () ->
                service.register(new RegisterRequest("Aaqib", "aaqib@example.com", "password123")));
        assertEquals(409, error.getStatusCode().value());
        verifyNoInteractions(jwtService);
    }

    @Test
    void loginUsesStoredPasswordHash() {
        User user = user();
        user.setPasswordHash(encoder.encode("password123"));
        when(repository.findByEmailIgnoreCase("aaqib@example.com")).thenReturn(Optional.of(user));
        AuthResponse response = new AuthResponse("signed-token", "Bearer", 900, UserResponse.from(user));
        when(jwtService.issue(user)).thenReturn(response);
        assertSame(response, service.login(new LoginRequest("AAQIB@example.com", "password123")));
    }

    @Test
    void wrongPasswordAndMissingAccountUseSameUnauthorizedMessage() {
        User user = user();
        user.setPasswordHash(encoder.encode("password123"));
        when(repository.findByEmailIgnoreCase("aaqib@example.com")).thenReturn(Optional.of(user));
        var wrong = assertThrows(ResponseStatusException.class, () ->
                service.login(new LoginRequest("aaqib@example.com", "wrong-password")));
        var missing = assertThrows(ResponseStatusException.class, () ->
                service.login(new LoginRequest("missing@example.com", "wrong-password")));
        assertEquals(401, wrong.getStatusCode().value());
        assertEquals(wrong.getReason(), missing.getReason());
        verifyNoInteractions(jwtService);
    }

    @Test
    void currentUserReturnsSafeFieldsAndRejectsMissingAccounts() {
        when(repository.findById(1L)).thenReturn(Optional.of(user()));
        assertEquals("aaqib@example.com", service.currentUser("1").email());
        assertEquals(401, assertThrows(ResponseStatusException.class,
                () -> service.currentUser("2")).getStatusCode().value());
        assertEquals(401, assertThrows(ResponseStatusException.class,
                () -> service.currentUser("not-an-id")).getStatusCode().value());
    }

    @Test
    void validationRejectsInvalidInputsAndMultibytePasswordsOver72Bytes() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(new RegisterRequest("Aaqib", "a@example.com", "password123")).isEmpty());
            assertFalse(validator.validate(new RegisterRequest(" ", "invalid", "short")).isEmpty());
            assertFalse(validator.validate(new RegisterRequest(null, null, null)).isEmpty());
            assertTrue(validator.validate(new RegisterRequest("Aaqib", "a@example.com", "é".repeat(36))).isEmpty());
            assertFalse(validator.validate(new RegisterRequest("Aaqib", "a@example.com", "é".repeat(37))).isEmpty());
            assertFalse(validator.validate(new LoginRequest("a@example.com", "é".repeat(37))).isEmpty());
        }
    }

    private User user() {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setName("Aaqib");
        user.setEmail("aaqib@example.com");
        user.setRole("USER");
        return user;
    }
}
