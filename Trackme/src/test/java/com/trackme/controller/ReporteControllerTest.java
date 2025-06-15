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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Date;
import java.sql.Timestamp;

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

    private PersonaDesaparecida personaDesaparecida;
    private MockMultipartFile mockFile;

    @BeforeEach
    void setUp() {
        personaDesaparecida = new PersonaDesaparecida();
        personaDesaparecida.setNombre("Juan Pérez");
        personaDesaparecida.setEdad(25);
        personaDesaparecida.setFechaDesaparicion(Timestamp.valueOf("2024-01-01 00:00:00"));
        personaDesaparecida.setLugarDesaparicion("Ciudad A");
        personaDesaparecida.setDescripcion("Descripción test");
        personaDesaparecida.setEmailReportaje("test@email.com");

        mockFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", "test image".getBytes());
    }

    @Test
    void crearReporte_FeatureToggleEnabled_Success() {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);
        when(reporteService.crearReporte(anyString(), anyInt(), any(LocalDate.class),
                anyString(), anyString(), anyString(), any())).thenReturn(personaDesaparecida);
        when(reporteValidationService.validarReporte(any(PersonaDesaparecida.class))).thenReturn(null);

        ResponseEntity<?> response = reporteController.crearReporte(
                "Juan Pérez", 25, LocalDate.of(2024, 1, 1),
                "Ciudad A", "Descripción test", "test@email.com", mockFile);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(personaDesaparecida, response.getBody());
        verify(reporteService, times(1)).crearReporte(anyString(), anyInt(), any(LocalDate.class),
                anyString(), anyString(), anyString(), any());
        verify(reporteValidationService, times(1)).validarReporte(any(PersonaDesaparecida.class));
    }

    @Test
    void crearReporte_FeatureToggleDisabledButEmailProvided_Success() {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(false);
        when(reporteService.crearReporte(anyString(), anyInt(), any(LocalDate.class),
                anyString(), anyString(), anyString(), any())).thenReturn(personaDesaparecida);
        when(reporteValidationService.validarReporte(any(PersonaDesaparecida.class))).thenReturn(null);

        ResponseEntity<?> response = reporteController.crearReporte(
                "Juan Pérez", 25, LocalDate.of(2024, 1, 1),
                "Ciudad A", "Descripción test", "test@email.com", mockFile);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(personaDesaparecida, response.getBody());
    }

    @Test
    void crearReporte_FeatureToggleDisabledAndNoEmail_Forbidden() {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(false);

        ResponseEntity<?> response = reporteController.crearReporte(
                "Juan Pérez", 25, LocalDate.of(2024, 1, 1),
                "Ciudad A", "Descripción test", null, mockFile);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("La creación de reportes está deshabilitada para usuarios no logueados.", response.getBody());
        verify(reporteService, never()).crearReporte(anyString(), anyInt(), any(LocalDate.class),
                anyString(), anyString(), anyString(), any());
    }

    @Test
    void crearReporte_ValidationError_BadRequest() {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);
        when(reporteService.crearReporte(anyString(), anyInt(), any(LocalDate.class),
                anyString(), anyString(), anyString(), any())).thenReturn(personaDesaparecida);
        when(reporteValidationService.validarReporte(any(PersonaDesaparecida.class)))
                .thenReturn("Error de validación");

        ResponseEntity<?> response = reporteController.crearReporte(
                "Juan Pérez", 25, LocalDate.of(2024, 1, 1),
                "Ciudad A", "Descripción test", "test@email.com", mockFile);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Error de validación", response.getBody());
    }

    @Test
    void crearReporte_ServiceException_InternalServerError() {
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);
        when(reporteService.crearReporte(anyString(), anyInt(), any(LocalDate.class),
                anyString(), anyString(), anyString(), any()))
                .thenThrow(new RuntimeException("Error de servicio"));

        ResponseEntity<?> response = reporteController.crearReporte(
                "Juan Pérez", 25, LocalDate.of(2024, 1, 1),
                "Ciudad A", "Descripción test", "test@email.com", mockFile);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Error de servicio", response.getBody());
    }

    @Test
    void obtenerReportesPorUsuario_Success() {
        List<PersonaDesaparecida> reportes = Arrays.asList(personaDesaparecida);
        when(reporteService.obtenerReportesPorEmail("test@email.com")).thenReturn(reportes);

        ResponseEntity<List<PersonaDesaparecida>> response =
                reporteController.obtenerReportesPorUsuario("test@email.com");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(reportes, response.getBody());
        verify(reporteService, times(1)).obtenerReportesPorEmail("test@email.com");
    }

    @Test
    void obtenerReportesPorUsuario_EmptyList() {
        when(reporteService.obtenerReportesPorEmail("test@email.com")).thenReturn(Collections.emptyList());

        ResponseEntity<List<PersonaDesaparecida>> response =
                reporteController.obtenerReportesPorUsuario("test@email.com");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void obtenerTodosLosReportes_Success() {
        List<PersonaDesaparecida> reportes = Arrays.asList(personaDesaparecida);
        when(reporteService.obtenerTodosLosReportes()).thenReturn(reportes);

        ResponseEntity<List<PersonaDesaparecida>> response = reporteController.obtenerTodosLosReportes();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(reportes, response.getBody());
        verify(reporteService, times(1)).obtenerTodosLosReportes();
    }

    @Test
    void obtenerReportesFiltrados_ConTodosLosParametros_Success() {
        List<PersonaDesaparecida> reportes = Arrays.asList(personaDesaparecida);
        LocalDate fecha = LocalDate.of(2024, 1, 1);
        when(reporteService.obtenerReportesFiltrados("Juan", 25, "Ciudad A", fecha))
                .thenReturn(reportes);

        ResponseEntity<List<PersonaDesaparecida>> response =
                reporteController.obtenerReportesFiltrados("Juan", 25, "Ciudad A", fecha);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(reportes, response.getBody());
        verify(reporteService, times(1)).obtenerReportesFiltrados("Juan", 25, "Ciudad A", fecha);
    }

    @Test
    void obtenerReportesFiltrados_ConParametrosNulos_Success() {
        List<PersonaDesaparecida> reportes = Arrays.asList(personaDesaparecida);
        when(reporteService.obtenerReportesFiltrados(null, null, null, null))
                .thenReturn(reportes);

        ResponseEntity<List<PersonaDesaparecida>> response =
                reporteController.obtenerReportesFiltrados(null, null, null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(reportes, response.getBody());
        verify(reporteService, times(1)).obtenerReportesFiltrados(null, null, null, null);
    }

    @Test
    void archivarReporte_Success() {
        doNothing().when(reporteService).archivarReporte(1L);

        ResponseEntity<String> response = reporteController.archivarReporte(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Reporte archivado exitosamente.", response.getBody());
        verify(reporteService, times(1)).archivarReporte(1L);
    }

    @Test
    void archivarReporte_ReporteNoEncontrado_NotFound() {
        doThrow(new RuntimeException("Reporte no encontrado"))
                .when(reporteService).archivarReporte(1L);

        ResponseEntity<String> response = reporteController.archivarReporte(1L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Reporte no encontrado", response.getBody());
        verify(reporteService, times(1)).archivarReporte(1L);
    }
}