package com.trackme.repository;

import com.trackme.model.Usuario;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<Usuario, Long> {
    boolean existsByEmail(String email); // Comprobación de existencia por email
    Optional<Usuario> findByEmail(String email);
}
