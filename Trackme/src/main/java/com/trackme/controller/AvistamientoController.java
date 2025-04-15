package com.trackme.controller;

import com.trackme.model.Avistamiento;
import com.trackme.service.AvistamientoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/avistamientos")
@CrossOrigin(origins = "http://localhost:4200")
public class AvistamientoController {

    @Autowired
    private AvistamientoService avistamientoService;

    @PostMapping("/crear")
    public ResponseEntity<Avistamiento> crearAvistamiento(@RequestBody Avistamiento avistamiento) {
        // Validaciones básicas
        if (avistamiento.getEmailUsuario() == null || avistamiento.getEmailUsuario().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (avistamiento.getPersonaDesaparecida() == null || avistamiento.getPersonaDesaparecida().getIdDesaparecido() == null) {
            return ResponseEntity.badRequest().build();
        }

        // Asignar fecha actual si no viene especificada
        if (avistamiento.getFecha() == null) {
            avistamiento.setFecha(new Date());
        }

        Avistamiento nuevoAvistamiento = avistamientoService.crearAvistamiento(avistamiento);
        return ResponseEntity.ok(nuevoAvistamiento);
    }

    @GetMapping("/usuario/{email}")
    public ResponseEntity<List<Avistamiento>> obtenerAvistamientosPorUsuario(@PathVariable String email) {
        List<Avistamiento> avistamientos = avistamientoService.obtenerAvistamientosPorUsuario(email);
        return ResponseEntity.ok(avistamientos);
    }

    @GetMapping("/reporte/{idPersonaDesaparecida}")
    public ResponseEntity<List<Avistamiento>> obtenerAvistamientosPorReporte(@PathVariable Long idPersonaDesaparecida) {
        List<Avistamiento> avistamientos = avistamientoService.obtenerAvistamientosPorReporte(idPersonaDesaparecida);
        return ResponseEntity.ok(avistamientos);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Avistamiento>> obtenerTodosLosAvistamientos() {
        List<Avistamiento> avistamientos = avistamientoService.obtenerTodosLosAvistamientos();
        return ResponseEntity.ok(avistamientos);
    }
}