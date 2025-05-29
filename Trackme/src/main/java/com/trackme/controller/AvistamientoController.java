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
@CrossOrigin(origins = "*") // Considera restringir esto en producción
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
        logger.info("Recibida solicitud POST /avistamientos/crear");
         if (!featureToggleService.isCreateSightingsEnabled() && avistamiento.getEmailUsuario() == null) {
             logger.warn("Intento de crear avistamiento por usuario no logueado mientras el feature toggle está desactivado.");
             return ResponseEntity.status(403).body("La creación de avistamientos está deshabilitada para usuarios no logueados.");
         }

         try {
             if (avistamiento.getFecha() == null) {
                 logger.debug("Fecha de avistamiento nula, usando fecha actual.");
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
             logger.error("Error inesperado al crear el avistamiento", e);
             return ResponseEntity.status(500).body("Error interno del servidor al crear el avistamiento.");
         }
    }

    // --- AÑADIR ESTE MÉTODO: Endpoint para obtener un avistamiento por su ID (para edición) ---
    @GetMapping("/{id}")
    public ResponseEntity<Avistamiento> obtenerAvistamientoPorId(@PathVariable Long id) {
        logger.info("Recibida solicitud GET /avistamientos/{} (obtener por ID)", id);
        Optional<Avistamiento> avistamiento = avistamientoService.obtenerAvistamientoPorId(id);

        if (avistamiento.isPresent()) {
            logger.info("Avistamiento con ID {} encontrado.", id);
            return ResponseEntity.ok(avistamiento.get());
        } else {
            logger.warn("Avistamiento con ID {} no encontrado (retornando 404).", id);
            return ResponseEntity.notFound().build();
        }
    }
    // ------------------------------------------------------------------------------------

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
            logger.info("Último avistamiento encontrado para ID_PersonaDesaparecida {}. ID Avistamiento: {}", idPersonaDesaparecida, avistamiento.get().getIdAvistamiento()); // Log adicional
            return ResponseEntity.ok(avistamiento.get());
        } else {
            logger.warn("No se encontró ningún avistamiento para ID_PersonaDesaparecida: {}", idPersonaDesaparecida);
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

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarAvistamiento(@PathVariable Long id, @RequestBody Avistamiento avistamientoActualizado) {
        logger.info("Recibida solicitud PUT /avistamientos/{} (actualizar)", id);
        try {
             
             if (avistamientoActualizado.getIdAvistamiento() != null && !avistamientoActualizado.getIdAvistamiento().equals(id)) {
                  logger.warn("ID en path ({}) no coincide con ID en cuerpo ({}) para actualizar. Usando ID del path.", id, avistamientoActualizado.getIdAvistamiento());
             }
             avistamientoActualizado.setIdAvistamiento(id);


            


             Avistamiento actualizado = avistamientoService.actualizarAvistamiento(id, avistamientoActualizado);

             logger.info("Avistamiento con ID {} actualizado exitosamente.", id);
             return ResponseEntity.ok(actualizado); 

          } catch (RuntimeException e) { 
              logger.error("Error al actualizar avistamiento {} (RuntimeException): {}", id, e.getMessage());
               if (e.getMessage() != null && e.getMessage().contains("no encontrado")) {
                   return ResponseEntity.status(404).body(e.getMessage());
               }
              return ResponseEntity.status(500).body("Error del servidor al actualizar el avistamiento: " + e.getMessage());
         } catch (Exception e) { 
             logger.error("Error inesperado al actualizar el avistamiento con ID " + id, e);
             return ResponseEntity.status(500).body("Error interno del servidor al actualizar el avistamiento.");
         }
    }
}