package com.aaqib.studentmanagement.repository;

import com.aaqib.studentmanagement.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {

    boolean existsByStudentNumber(String studentNumber);

    boolean existsByEmailIgnoreCase(String email);
}