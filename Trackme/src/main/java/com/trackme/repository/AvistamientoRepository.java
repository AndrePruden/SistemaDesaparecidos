package com.trackme.repository;

import com.trackme.model.Avistamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvistamientoRepository extends JpaRepository<Avistamiento, Long> {
    List<Avistamiento> findByEmailUsuario(String emailUsuario);
    List<Avistamiento> findByIdPersonaDesaparecida(Long idPersonaDesaparecida);
}