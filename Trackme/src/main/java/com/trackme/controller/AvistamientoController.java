package com.trackme.controller;

import com.trackme.model.Avistamiento;
import com.trackme.service.AvistamientoService;
import com.trackme.service.AvistamientoValidationService;
import com.trackme.service.FeatureToggleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/avistamientos")
@CrossOrigin(origins = "http://localhost:4200")
public class AvistamientoController {

    private static final Logger logger = LoggerFactory.getLogger(AvistamientoController.class);

    @Autowired
    public AvistamientoService avistamientoService;

    @Autowired
    private FeatureToggleService featureToggleService;

    @Autowired
    private AvistamientoValidationService avistamientoValidationService;

    @PostMapping("/crear")
    public ResponseEntity<?> crearAvistamiento(@RequestBody Avistamiento avistamiento) {

        if (!featureToggleService.isCreateSightingsEnabled() && avistamiento.getEmailUsuario() == null) {
            logger.warn("Intento de crear avistamiento por usuario no logueado mientras el feature toggle está desactivado.");
            return ResponseEntity.status(403).body("La creación de avistamientos está deshabilitada para usuarios no logueados.");
        }

        try {
            if (avistamiento.getFecha() == null) {
                avistamiento.setFecha(new Date());
            }

            String validacion = avistamientoValidationService.validarAvistamiento(avistamiento);
            if (validacion != null) {
                logger.warn("Avistamiento inválido recibido: {}", validacion);
                return ResponseEntity.badRequest().body(validacion);
            }

            Avistamiento nuevo = avistamientoService.crearAvistamiento(avistamiento);
            logger.info("Avistamiento creado exitosamente con ID: {}", nuevo.getIdAvistamiento());
            return ResponseEntity.ok(nuevo);

        } catch (Exception e) {
            logger.error("Error al crear el avistamiento", e);
            return ResponseEntity.status(500).body("Error interno al crear el avistamiento.");
        }
    }

    @GetMapping("/usuario/{email}")
    public ResponseEntity<List<Avistamiento>> obtenerAvistamientosPorUsuario(@PathVariable String email) {
        logger.info("Solicitando avistamientos para usuario: {}", email);
        List<Avistamiento> avistamientos = avistamientoService.obtenerAvistamientosPorUsuario(email);
        logger.debug("Se encontraron {} avistamientos para el usuario {}", avistamientos.size(), email);
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
        Optional<Avistamiento> avistamiento = avistamientoService.obtenerUltimoAvistamiento(idPersonaDesaparecida);
        if (avistamiento.isPresent()) {
            return ResponseEntity.ok(avistamiento.get());
        } else {
            logger.warn("No se encontró ningún avistamiento para ID: {}", idPersonaDesaparecida);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<Avistamiento>> obtenerAvistamientosFiltrados (
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "lugar", required = false) String lugar,
            @RequestParam(value = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        List<Avistamiento> avistamientos = avistamientoService.obtenerAvistamientosFiltrados(nombre, lugar, fecha);
        return ResponseEntity.ok(avistamientos);
    }
}