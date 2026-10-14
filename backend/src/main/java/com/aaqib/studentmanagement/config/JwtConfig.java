package com.aaqib.studentmanagement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Objects;

@Configuration
public class JwtConfig {

    @Bean
    public SecretKey jwtSigningKey(@Value("${app.jwt.secret}") String secret) {
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT_SECRET must be valid Base64");
        }
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must decode to at least 32 bytes");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSigningKey) {
        return NimbusJwtEncoder.withSecretKey(jwtSigningKey)
                .algorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public JwtDecoder jwtDecoder(
            SecretKey jwtSigningKey,
            @Value("${app.jwt.issuer}") String issuer
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSigningKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer),
                new JwtClaimValidator<Instant>(JwtClaimNames.EXP, Objects::nonNull),
                new JwtClaimValidator<String>(JwtClaimNames.SUB,
                        subject -> subject != null && subject.matches("[1-9][0-9]*"))
        ));
        return decoder;
    }
}
