package com.careflow.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.careflow.backend.entity.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
}