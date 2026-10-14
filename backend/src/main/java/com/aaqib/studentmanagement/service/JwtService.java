package com.aaqib.studentmanagement.service;

import com.aaqib.studentmanagement.dto.response.AuthResponse;
import com.aaqib.studentmanagement.dto.response.UserResponse;
import com.aaqib.studentmanagement.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final String issuer;
    private final long ttlSeconds;

    public JwtService(
            JwtEncoder encoder,
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.ttl-seconds}") long ttlSeconds
    ) {
        if (ttlSeconds < 60 || ttlSeconds > 3600) {
            throw new IllegalStateException("JWT token lifetime must be between 60 and 3600 seconds");
        }
        this.encoder = encoder;
        this.issuer = issuer;
        this.ttlSeconds = ttlSeconds;
    }

    public AuthResponse issue(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .claim("roles", List.of(user.getRole()))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", ttlSeconds, UserResponse.from(user));
    }
}
