package com.aaqib.studentmanagement;

import com.aaqib.studentmanagement.config.*;
import com.aaqib.studentmanagement.controller.*;
import com.aaqib.studentmanagement.dto.response.*;
import com.aaqib.studentmanagement.entity.User;
import com.aaqib.studentmanagement.repository.UserRepository;
import com.aaqib.studentmanagement.security.ApiSecurityErrors;
import com.aaqib.studentmanagement.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {AuthController.class, StudentController.class, CourseController.class})
@Import({AuthService.class, JwtService.class, JwtConfig.class, PasswordConfig.class,
        SecurityConfig.class, WebConfig.class, ApiSecurityErrors.class})
@TestPropertySource(properties = {
        "app.jwt.secret=AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=",
        "app.jwt.issuer=student-management", "app.jwt.ttl-seconds=900",
        "app.frontend-url=http://localhost:3000"
})
class AuthSecurityTests {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder encoder;
    @MockitoBean UserRepository repository;
    @MockitoBean StudentService studentService;
    @MockitoBean CourseService courseService;

    @BeforeEach
    void setUp() {
        when(studentService.getAll()).thenReturn(List.of());
        when(courseService.getAll()).thenReturn(List.of());
        StudentResponse student = new StudentResponse(1L, "S001", "Test", "Student", "student@example.com", null, null);
        CourseResponse course = new CourseResponse(1L, "CS101", "Computing", "Description", 3, null);
        when(studentService.getById(1L)).thenReturn(student);
        when(courseService.getById(1L)).thenReturn(course);
        when(studentService.create(any())).thenReturn(student);
        when(courseService.create(any())).thenReturn(course);
        when(studentService.update(any(), any())).thenReturn(student);
        when(courseService.update(any(), any())).thenReturn(course);
    }

    @Test
    void registrationCreatesUserAndCannotChooseAdminRole() throws Exception {
        when(repository.saveAndFlush(any())).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 1L);
            return user;
        });
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Test User","email":"Test@Example.com","password":"password123","role":"ADMIN"}
                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.accessToken", not(emptyString())))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void validLoginTokenCanBeUsedForMe() throws Exception {
        User user = user("USER");
        user.setPasswordHash(encoder.encode("password123"));
        when(repository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(repository.findById(1L)).thenReturn(Optional.of(user));
        var result = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"TEST@example.com","password":"password123"}
                """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(cookie().doesNotExist("JSESSIONID")).andReturn();
        String token = new ObjectMapper().readTree(result.getResponse().getContentAsString())
                .get("accessToken").asString();
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void wrongCredentialsReturnGeneric401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"missing@example.com","password":"password123"}
                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password"));
    }

    @Test
    void duplicateEmailReturns409WithSafeDetail() throws Exception {
        when(repository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Test","email":"test@example.com","password":"password123"}
                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Email is already registered"));
    }

    @Test
    void invalidFieldsReturn400WithFieldMessages() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":" ","email":"bad-email","password":"short"}
                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
        verifyNoInteractions(repository);
    }

    @Test
    void malformedJsonReturns400() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{broken"))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @CsvSource({"/api/students", "/api/students/1", "/api/courses", "/api/courses/1", "/api/auth/me"})
    void anonymousRequestsReturnJson401(String path) throws Exception {
        mvc.perform(get(path).header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @ParameterizedTest
    @CsvSource({"/api/students", "/api/students/1", "/api/courses", "/api/courses/1"})
    void userCanReadStudentAndCourseRecords(String path) throws Exception {
        mvc.perform(get(path).header("Authorization", bearer("USER"))).andExpect(status().isOk());
    }

    @ParameterizedTest
    @MethodSource("mutations")
    void userCannotMutateRecords(Mutation mutation) throws Exception {
        mvc.perform(mutation.request().header("Authorization", bearer("USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        verifyNoInteractions(studentService, courseService);
    }

    @ParameterizedTest
    @MethodSource("mutations")
    void adminCanMutateRecords(Mutation mutation) throws Exception {
        mvc.perform(mutation.request().header("Authorization", bearer("ADMIN")))
                .andExpect(status().is(mutation.expectedStatus()));
    }

    @ParameterizedTest
    @MethodSource("mutations")
    void anonymousUserCannotMutateRecords(Mutation mutation) throws Exception {
        mvc.perform(mutation.request()).andExpect(status().isUnauthorized());
        verifyNoInteractions(studentService, courseService);
    }

    @Test
    void allowedOriginPreflightWorksWithoutAuthentication() throws Exception {
        mvc.perform(options("/api/students")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void otherOriginsAreRejected() throws Exception {
        mvc.perform(options("/api/students")
                        .header("Origin", "http://untrusted.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void invalidOrTamperedTokensReturn401() throws Exception {
        mvc.perform(get("/api/students").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
        String token = jwtService.issue(user("ADMIN")).accessToken();
        int signatureStart = token.lastIndexOf('.') + 1;
        char replacement = token.charAt(signatureStart) == 'A' ? 'B' : 'A';
        String tampered = token.substring(0, signatureStart) + replacement + token.substring(signatureStart + 1);
        mvc.perform(get("/api/students").header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authorizedMissingRecordReturns404() throws Exception {
        when(studentService.getById(2L)).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        mvc.perform(get("/api/students/2").header("Authorization", bearer("USER")))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.detail").value("Student not found"));
    }

    @Test
    void invalidCourseInputStillReturns400ForAdmin() throws Exception {
        mvc.perform(post("/api/courses").header("Authorization", bearer("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseCode\":\"CS101\",\"name\":\"Computing\",\"credits\":0}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.credits").exists());
    }

    private String bearer(String role) {
        return "Bearer " + jwtService.issue(user(role)).accessToken();
    }

    private User user(String role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setName("Test User");
        user.setEmail("test@example.com");
        user.setRole(role);
        return user;
    }

    record Mutation(HttpMethod method, String path, String body, int expectedStatus) {
        MockHttpServletRequestBuilder request() {
            var request = org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request(method, path);
            return body == null ? request : request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
    }

    static Stream<Mutation> mutations() {
        String student = "{\"studentNumber\":\"S001\",\"firstName\":\"Test\",\"lastName\":\"Student\",\"email\":\"student@example.com\"}";
        String course = "{\"courseCode\":\"CS101\",\"name\":\"Computing\",\"credits\":3}";
        return Stream.of(
                new Mutation(HttpMethod.POST, "/api/students", student, 201),
                new Mutation(HttpMethod.PUT, "/api/students/1", student, 200),
                new Mutation(HttpMethod.DELETE, "/api/students/1", null, 204),
                new Mutation(HttpMethod.POST, "/api/courses", course, 201),
                new Mutation(HttpMethod.PUT, "/api/courses/1", course, 200),
                new Mutation(HttpMethod.DELETE, "/api/courses/1", null, 204)
        );
    }
}
