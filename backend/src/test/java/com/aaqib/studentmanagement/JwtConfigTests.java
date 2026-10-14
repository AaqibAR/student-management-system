package com.aaqib.studentmanagement;

import com.aaqib.studentmanagement.config.JwtConfig;
import com.aaqib.studentmanagement.entity.User;
import com.aaqib.studentmanagement.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtConfigTests {
    private static final String SECRET = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=";

    @Test
    void invalidAndShortSecretsFailWithoutExposingValue() {
        JwtConfig config = new JwtConfig();
        assertThrows(IllegalStateException.class, () -> config.jwtSigningKey("not-valid-base64"));
        assertThrows(IllegalStateException.class, () -> config.jwtSigningKey(
                Base64.getEncoder().encodeToString(new byte[31])));
        assertEquals(32, config.jwtSigningKey(SECRET).getEncoded().length);
    }

    @Test
    void issuedTokenHasVerifiedSubjectRoleIssuerAndFifteenMinuteExpiry() {
        JwtConfig config = new JwtConfig();
        var key = config.jwtSigningKey(SECRET);
        var service = new JwtService(config.jwtEncoder(key), "student-management", 900);
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 42L);
        user.setName("Test User");
        user.setEmail("user@example.com");
        user.setRole("USER");
        var response = service.issue(user);
        Jwt jwt = config.jwtDecoder(key, "student-management").decode(response.accessToken());
        assertEquals("42", jwt.getSubject());
        assertEquals("USER", jwt.getClaimAsStringList("roles").getFirst());
        assertEquals(900, response.expiresIn());
        assertEquals(900, jwt.getExpiresAt().getEpochSecond() - jwt.getIssuedAt().getEpochSecond());
        assertEquals("Bearer", response.tokenType());
        assertFalse(jwt.getClaims().containsKey("password"));
        assertFalse(jwt.getClaims().containsKey("passwordHash"));
    }

    @Test
    void expiredWrongIssuerMissingExpiryAndWrongSignatureAreRejected() {
        JwtConfig config = new JwtConfig();
        var key = config.jwtSigningKey(SECRET);
        var encoder = config.jwtEncoder(key);
        var decoder = config.jwtDecoder(key, "student-management");
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        var expired = JwtClaimsSet.builder().issuer("student-management").subject("1")
                .issuedAt(Instant.now().minusSeconds(600)).expiresAt(Instant.now().minusSeconds(120)).build();
        var wrongIssuer = JwtClaimsSet.builder().issuer("another-system").subject("1")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(900)).build();
        var noExpiry = JwtClaimsSet.builder().issuer("student-management").subject("1")
                .issuedAt(Instant.now()).build();
        assertThrows(JwtException.class, () -> decoder.decode(encoder.encode(JwtEncoderParameters.from(header, expired)).getTokenValue()));
        assertThrows(JwtException.class, () -> decoder.decode(encoder.encode(JwtEncoderParameters.from(header, wrongIssuer)).getTokenValue()));
        assertThrows(JwtException.class, () -> decoder.decode(encoder.encode(JwtEncoderParameters.from(header, noExpiry)).getTokenValue()));
        String otherSecret = Base64.getEncoder().encodeToString(new byte[32]);
        var otherEncoder = config.jwtEncoder(config.jwtSigningKey(otherSecret));
        var valid = JwtClaimsSet.builder().issuer("student-management").subject("1")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(900)).build();
        assertThrows(JwtException.class, () -> decoder.decode(otherEncoder.encode(JwtEncoderParameters.from(header, valid)).getTokenValue()));
    }
}
