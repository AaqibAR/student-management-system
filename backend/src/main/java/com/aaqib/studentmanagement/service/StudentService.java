package com.aaqib.studentmanagement.service;

import com.aaqib.studentmanagement.dto.StudentRequest;
import com.aaqib.studentmanagement.dto.StudentResponse;
import com.aaqib.studentmanagement.entity.Student;
import com.aaqib.studentmanagement.repository.StudentRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class StudentService {

    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    public List<StudentResponse> getAll() {
        return repository.findAll(Sort.by("id")).stream()
                .map(StudentResponse::from)
                .toList();
    }

    public StudentResponse getById(Long id) {
        return StudentResponse.from(findStudent(id));
    }

    public StudentResponse create(StudentRequest request) {
        String number = normalizeNumber(request.studentNumber());
        String email = normalizeEmail(request.email());

        if (repository.existsByStudentNumber(number)) {
            throw conflict("Student number already exists");
        }

        if (repository.existsByEmailIgnoreCase(email)) {
            throw conflict("Student email already exists");
        }

        Student student = new Student();
        applyRequest(student, request, number, email);

        return save(student);
    }

    public StudentResponse update(Long id, StudentRequest request) {
        Student student = findStudent(id);
        String number = normalizeNumber(request.studentNumber());
        String email = normalizeEmail(request.email());

        if (repository.existsByStudentNumberAndIdNot(number, id)) {
            throw conflict("Student number already exists");
        }

        if (repository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw conflict("Student email already exists");
        }

        applyRequest(student, request, number, email);

        return save(student);
    }

    public void delete(Long id) {
        repository.delete(findStudent(id));
    }

    private Student findStudent(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Student not found"
                ));
    }

    private void applyRequest(
            Student student,
            StudentRequest request,
            String number,
            String email
    ) {
        student.setStudentNumber(number);
        student.setFirstName(request.firstName().trim());
        student.setLastName(request.lastName().trim());
        student.setEmail(email);
        student.setPhone(
                request.phone() == null ? null : request.phone().trim()
        );
    }

    private StudentResponse save(Student student) {
        try {
            return StudentResponse.from(repository.saveAndFlush(student));
        } catch (DataIntegrityViolationException exception) {
            throw conflict("Student data conflicts with an existing record");
        }
    }

    private String normalizeNumber(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}