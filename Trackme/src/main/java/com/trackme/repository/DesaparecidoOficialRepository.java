package com.trackme.repository;

import com.trackme.model.DesaparecidoOficial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DesaparecidoOficialRepository extends JpaRepository<DesaparecidoOficial, Long> {
    List<DesaparecidoOficial> findByNombreContainingIgnoreCase(String nombre);
}
