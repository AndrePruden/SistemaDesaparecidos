package com.trackme.repository;

import com.trackme.model.Avistamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvistamientoRepository extends JpaRepository<Avistamiento, Long> {
    List<Avistamiento> findByEmailUsuario(String emailUsuario);
    List<Avistamiento> findByPersonaDesaparecida_IdDesaparecido(Long idPersonaDesaparecido);

    @Query("SELECT a FROM Avistamiento a WHERE a.personaDesaparecida.idDesaparecido = :idReporte ORDER BY a.fecha DESC")
    List<Avistamiento> findUltimoAvistamientoPorReporte(@Param("idReporte") Long idReporte);
}