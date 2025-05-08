package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.ReporteService;
import com.trackme.service.ReporteValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteControllerTest {

    @Mock
    private ReporteService reporteService;

    @Mock
    private ReporteValidationService reporteValidationService;

    @Mock
    private FeatureToggleService featureToggleService;

    @InjectMocks
    private ReporteController reporteController;

    private MockMultipartFile mockFile;

    @BeforeEach
    void setUp() {
        mockFile = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );
    }

    @Test
    void crearReporteExitoso() {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);
        when(reporteValidationService.validarReporte(any())).thenReturn(null);

        ResponseEntity<?> response = reporteController.crearReporte(
                "Nombre", 30, null, "Lugar", "Descripción", "test@email.com", mockFile
        );

        assertEquals(200, response.getStatusCodeValue());
    }

    @Test
    void obtenerReportesPorUsuario() {
        when(reporteService.obtenerReportesPorEmail(anyString()))
                .thenReturn(Collections.emptyList());

        ResponseEntity<List<PersonaDesaparecida>> response =
                reporteController.obtenerReportesPorUsuario("test@email.com");

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void obtenerTodosLosReportes() {
        when(reporteService.obtenerTodosLosReportes())
                .thenReturn(Collections.emptyList());

        ResponseEntity<List<PersonaDesaparecida>> response =
                reporteController.obtenerTodosLosReportes();

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void obtenerReportesFiltrados() {
        when(reporteService.obtenerReportesFiltrados(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        ResponseEntity<List<PersonaDesaparecida>> response =
                reporteController.obtenerReportesFiltrados(null, null, null, null);

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().isEmpty());
    }
}