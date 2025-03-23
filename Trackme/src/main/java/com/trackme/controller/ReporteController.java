package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.PersonaDesaparecidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reportes")
@CrossOrigin(origins = "http://localhost:4200")
public class ReporteController {

    @Autowired
    private PersonaDesaparecidaService personaDesaparecidaService;

    @PostMapping("/crear")
    public ResponseEntity<PersonaDesaparecida> crearReporte(@RequestBody PersonaDesaparecida reporte) {
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
}