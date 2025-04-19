package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.repository.AvistamientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AvistamientoService {

    @Autowired
    private AvistamientoRepository avistamientoRepository;

    public Avistamiento crearAvistamiento(Avistamiento avistamiento) {
        return avistamientoRepository.save(avistamiento);
    }

    public List<Avistamiento> obtenerAvistamientosPorUsuario(String emailUsuario) {
        return avistamientoRepository.findByEmailUsuario(emailUsuario);
    }

    public List<Avistamiento> obtenerAvistamientosPorReporte(Long idPersonaDesaparecida) {
        return avistamientoRepository.findByPersonaDesaparecida_IdDesaparecido(idPersonaDesaparecida);
    }

    public List<Avistamiento> obtenerTodosLosAvistamientos() {
        return avistamientoRepository.findAll();
    }
}