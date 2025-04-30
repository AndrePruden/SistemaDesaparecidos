package com.trackme.controller;

import com.trackme.model.Avistamiento;
import com.trackme.service.AvistamientoService;
import com.trackme.service.FeatureToggleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/avistamientos")
@CrossOrigin(origins = "http://localhost:4200")
public class AvistamientoController {

    private static final Logger logger = LoggerFactory.getLogger(AvistamientoController.class);

    @Autowired
    private AvistamientoService avistamientoService;

    @Autowired
    private FeatureToggleService featureToggleService;

    @PostMapping("/crear")
    public ResponseEntity<Avistamiento> crearAvistamiento(
            @RequestBody Avistamiento avistamiento,
            @RequestParam(value = "isLoggedIn", defaultValue = "false") boolean isLoggedIn
        ) {
        logger.info("Solicitud para crear avistamiento: {}", avistamiento);

        if (!isLoggedIn && !featureToggleService.isCreateSightingsEnabled()) {
            logger.warn("Avistamiento inválido recibido por usuario no logueado mientras el feature toggle está desactivado.");
            return ResponseEntity.status(403).body(null);
        }

        if (!esAvistamientoValido(avistamiento)) {
            logger.warn("Avistamiento inválido recibido: {}", avistamiento);
            return ResponseEntity.badRequest().build();
        }

        if (avistamiento.getFecha() == null) {
            asignarFechaActual(avistamiento);
            logger.debug("Fecha asignada automáticamente al avistamiento: {}", avistamiento.getFecha());
        }
        try {
            Avistamiento nuevo = avistamientoService.crearAvistamiento(avistamiento);
            logger.info("Avistamiento creado exitosamente con ID: {}", nuevo.getIdAvistamiento());
            return ResponseEntity.ok(nuevo);
        } catch (Exception e) {
            logger.error("Error al crear el avistamiento", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private boolean esAvistamientoValido(Avistamiento avistamiento) {
        return avistamiento.getEmailUsuario() != null && !avistamiento.getEmailUsuario().isEmpty()
                && avistamiento.getPersonaDesaparecida() != null
                && avistamiento.getPersonaDesaparecida().getIdDesaparecido() != null;
    }

    private void asignarFechaActual(Avistamiento avistamiento) {
        avistamiento.setFecha(new Date());
    }

    @GetMapping("/usuario/{email}")
    public ResponseEntity<List<Avistamiento>> obtenerAvistamientosPorUsuario(@PathVariable String email) {
        logger.info("Solicitando avistamientos para usuario: {}", email);
        List<Avistamiento> avistamientos = avistamientoService.obtenerAvistamientosPorUsuario(email);
        logger.debug("Se encontraron {} avistamientos para el usuario {}", avistamientos.size(), email);
        return ResponseEntity.ok(avistamientos);
    }

    @GetMapping("/reporte/{idPersonaDesaparecida}")
    public ResponseEntity<List<Avistamiento>> obtenerAvistamientosPorReporte(@PathVariable Long idPersonaDesaparecida) {
        logger.info("Solicitando avistamientos para persona desaparecida con ID: {}", idPersonaDesaparecida);
        List<Avistamiento> avistamientos = avistamientoService.obtenerAvistamientosPorReporte(idPersonaDesaparecida);
        logger.debug("Se encontraron {} avistamientos para el reporte ID {}", avistamientos.size(), idPersonaDesaparecida);
        return ResponseEntity.ok(avistamientos);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Avistamiento>> obtenerTodosLosAvistamientos() {
        logger.info("Solicitando todos los avistamientos");
        List<Avistamiento> avistamientos = avistamientoService.obtenerTodosLosAvistamientos();
        logger.debug("Total de avistamientos encontrados: {}", avistamientos.size());
        return ResponseEntity.ok(avistamientos);
    }

    @GetMapping("/ultimo/{idPersonaDesaparecida}")
    public ResponseEntity<Avistamiento> obtenerUltimoAvistamiento(@PathVariable Long idPersonaDesaparecida) {
        logger.info("Solicitando último avistamiento para persona desaparecida con ID: {}", idPersonaDesaparecida);
        return avistamientoService.obtenerUltimoAvistamiento(idPersonaDesaparecida)
                .map(avistamiento -> {
                    logger.debug("Último avistamiento encontrado: {}", avistamiento);
                    return ResponseEntity.ok(avistamiento);
                })
                .orElseGet(() -> {
                    logger.warn("No se encontró ningún avistamiento para ID: {}", idPersonaDesaparecida);
                    return ResponseEntity.notFound().build();
                });
    }
}