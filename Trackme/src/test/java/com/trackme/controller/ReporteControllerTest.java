
package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.PersonaDesaparecidaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteControllerTest {

    @Mock
    private PersonaDesaparecidaService personaDesaparecidaService;

    @InjectMocks
    private ReporteController reporteController;

    private PersonaDesaparecida reporte;

    @BeforeEach
    void setUp() {
        reporte = new PersonaDesaparecida();
        reporte.setIdDesaparecido(1L);
        reporte.setEmailReportaje("test@example.com");
        reporte.setNombre("Juan Perez");
    }

    @Test
    void testCrearReporte() {
        when(personaDesaparecidaService.crearReporte(any(PersonaDesaparecida.class))).thenReturn(reporte);

        ResponseEntity<PersonaDesaparecida> response = reporteController.crearReporte(reporte);

        assertNotNull(response.getBody());
        assertEquals(reporte.getIdDesaparecido(), response.getBody().getIdDesaparecido());
    }

    @Test
    void testObtenerReportesPorUsuario() {
        List<PersonaDesaparecida> reportes = Arrays.asList(reporte);
        when(personaDesaparecidaService.obtenerReportesPorEmail("test@example.com")).thenReturn(reportes);

        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerReportesPorUsuario("test@example.com");

        assertNotNull(response.getBody());
        assertFalse(response.getBody().isEmpty());
    }

    @Test
    void testObtenerTodosLosReportes() {
        List<PersonaDesaparecida> reportes = Arrays.asList(reporte);
        when(personaDesaparecidaService.obtenerTodosLosReportes()).thenReturn(reportes);

        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerTodosLosReportes();

        assertNotNull(response.getBody());
        assertFalse(response.getBody().isEmpty());
    }
}

