package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.PersonaDesaparecidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/reportes")
@CrossOrigin(origins = "http://localhost:4200")
public class ReporteController {

    @Autowired
    private PersonaDesaparecidaService personaDesaparecidaService;

    @PostMapping("/crear")
    public ResponseEntity<?> crearReporte(@RequestBody PersonaDesaparecida reporte) {
        // Validación del nombre
        if (reporte.getNombre() == null || reporte.getNombre().trim().isEmpty() || 
            reporte.getNombre().length() < 2 || 
            Pattern.compile("[0-9]").matcher(reporte.getNombre()).find()) {
            return ResponseEntity.badRequest().body("El nombre debe tener al menos 2 caracteres y no contener números");
        }

        // Validación de la edad
        if (reporte.getEdad() == null || reporte.getEdad() <= 0 || reporte.getEdad() > 200) {
            return ResponseEntity.badRequest().body("La edad debe ser un número positivo entre 1 y 200");
        }

        // Validación de la fecha
        if (reporte.getFechaDesaparicion() == null) {
            reporte.setFechaDesaparicion(Date.from(LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()));
        } else {
            LocalDate fecha = reporte.getFechaDesaparicion().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            if (fecha.getYear() < 2024) {
                return ResponseEntity.badRequest().body("El año de desaparición debe ser 2024 o superior");
            }
        }

        // Validación del lugar de desaparición
        if (reporte.getLugarDesaparicion() == null || reporte.getLugarDesaparicion().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El lugar de desaparición no puede estar vacío");
        }

        // Validación de la descripción (opcional pero si se envía no debe ser solo espacios)
        if (reporte.getDescripcion() != null && reporte.getDescripcion().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("La descripción no puede contener solo espacios");
        }

        PersonaDesaparecida nuevoReporte = personaDesaparecidaService.crearReporte(reporte);
        return ResponseEntity.ok(nuevoReporte);
    }

    @GetMapping("/usuario/{email}")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerReportesPorUsuario(@PathVariable String email) {
        List<PersonaDesaparecida> reportes = personaDesaparecidaService.obtenerReportesPorEmail(email);
        return ResponseEntity.ok(reportes);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<PersonaDesaparecida>> obtenerTodosLosReportes() {
        List<PersonaDesaparecida> reportes = personaDesaparecidaService.obtenerTodosLosReportes();
        return ResponseEntity.ok(reportes);
    }

    // ... (otros métodos permanecen igual)
}