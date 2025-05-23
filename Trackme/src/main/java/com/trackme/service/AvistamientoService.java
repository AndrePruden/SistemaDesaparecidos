package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.AvistamientoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AvistamientoService {

    private static final Logger logger = LoggerFactory.getLogger(AvistamientoService.class);

    @Autowired
    private AvistamientoRepository avistamientoRepository;

    public Avistamiento crearAvistamiento(Avistamiento avistamiento) {
        logger.info("Creando nuevo avistamiento para el usuario: {}", avistamiento.getEmailUsuario());
        Avistamiento creado = avistamientoRepository.save(avistamiento);
        logger.info("Avistamiento creado con ID: {}", creado.getIdAvistamiento());
        return creado;
    }

    public List<Avistamiento> obtenerAvistamientosPorUsuario(String emailUsuario) {
        logger.info("Obteniendo avistamientos para el usuario: {}", emailUsuario);
        List<Avistamiento> avistamientos = avistamientoRepository.findByEmailUsuario(emailUsuario);
        logger.info("Cantidad de avistamientos encontrados: {}", avistamientos.size());
        return avistamientos;
    }

    public List<Avistamiento> obtenerAvistamientosPorReporte(Long idPersonaDesaparecida) {
        logger.info("Obteniendo avistamientos para la persona desaparecida con ID: {}", idPersonaDesaparecida);
        List<Avistamiento> avistamientos = avistamientoRepository.findByPersonaDesaparecida_IdDesaparecido(idPersonaDesaparecida);
        logger.info("Cantidad de avistamientos encontrados: {}", avistamientos.size());
        return avistamientos;

    }

    public List<Avistamiento> obtenerTodosLosAvistamientos() {
        logger.info("Obteniendo todos los avistamientos del sistema");
        List<Avistamiento> avistamientos = avistamientoRepository.findAll();
        logger.info("Total de avistamientos encontrados: {}", avistamientos.size());
        return avistamientos;
    }

    public Optional<Avistamiento> obtenerUltimoAvistamiento(Long idReporte) {
        logger.info("Buscando el último avistamiento para la persona desaparecida con ID: {}", idReporte);
        List<Avistamiento> lista = avistamientoRepository.findUltimoAvistamientoPorReporte(idReporte);
        if (lista.isEmpty()) {
            logger.warn("No se encontraron avistamientos para el ID: {}", idReporte);
            return Optional.empty();
        } else {
            Avistamiento ultimoAvistamiento = lista.get(lista.size() - 1);
            logger.info("Último avistamiento encontrado con ID: {}", ultimoAvistamiento.getIdAvistamiento());
            return Optional.of(lista.get(0));
        }
    }

    public List<Avistamiento> obtenerAvistamientosFiltrados(String nombre, String lugar, LocalDate fecha) {
        List<Avistamiento> avistamientos = obtenerTodosLosAvistamientos();

        if (nombre != null && !nombre.isEmpty()) {
            avistamientos = avistamientos.stream()
                    .filter(r -> r.getPersonaDesaparecida().getNombre().toLowerCase().contains(nombre.toLowerCase()))
                    .collect(Collectors.toList());
        }
        if (lugar != null && !lugar.isEmpty()) {
            avistamientos = avistamientos.stream()
                    .filter(r -> r.getUbicacion().toLowerCase().contains(lugar.toLowerCase()))
                    .collect(Collectors.toList());
        }
        if (fecha != null) {
            avistamientos = avistamientos.stream()
                    .filter(r -> r.getFecha().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().equals(fecha))
                    .collect(Collectors.toList());
        }

        return avistamientos;
    }
}