package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.PersonaDesaparecidaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PersonaDesaparecidaService {

    @Autowired
    private PersonaDesaparecidaRepository personaDesaparecidaRepository;

    public PersonaDesaparecida crearReporte(PersonaDesaparecida reporte) {
        return personaDesaparecidaRepository.save(reporte);
    }

    public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
        return personaDesaparecidaRepository.findByEmailReportaje(email);
    }

    public List<PersonaDesaparecida> obtenerTodosLosReportes() {
        return personaDesaparecidaRepository.findAll();
    }

    public PersonaDesaparecida obtenerPorId(Long id) {
        return personaDesaparecidaRepository.findById(id).orElse(null);
    }

    public PersonaDesaparecida actualizarReporte(PersonaDesaparecida reporte) {
        // Asegúrate de que el reporte exista antes de actualizar
        if (reporte.getIdDesaparecido() != null) {
            return personaDesaparecidaRepository.save(reporte); // Guardar o actualizar el reporte
        }
        return null;
    }

}