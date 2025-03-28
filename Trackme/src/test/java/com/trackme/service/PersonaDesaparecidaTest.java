package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.PersonaDesaparecidaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PersonaDesaparecidaServiceTest {

    @Mock
    private PersonaDesaparecidaRepository personaDesaparecidaRepository;

    @InjectMocks
    private PersonaDesaparecidaService personaDesaparecidaService;

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
        when(personaDesaparecidaRepository.save(any(PersonaDesaparecida.class))).thenReturn(reporte);
        PersonaDesaparecida result = personaDesaparecidaService.crearReporte(reporte);

        assertNotNull(result);
        assertEquals(reporte.getIdDesaparecido(), result.getIdDesaparecido());
    }

    @Test
    void testObtenerReportesPorEmail() {
        List<PersonaDesaparecida> reportes = Arrays.asList(reporte);
        when(personaDesaparecidaRepository.findByEmailReportaje("test@example.com")).thenReturn(reportes);

        List<PersonaDesaparecida> result = personaDesaparecidaService.obtenerReportesPorEmail("test@example.com");

        assertNotNull(result);
        assertFalse(result.isEmpty());
    }

    @Test
    void testObtenerTodosLosReportes() {
        List<PersonaDesaparecida> reportes = Arrays.asList(reporte);
        when(personaDesaparecidaRepository.findAll()).thenReturn(reportes);

        List<PersonaDesaparecida> result = personaDesaparecidaService.obtenerTodosLosReportes();

        assertNotNull(result);
        assertFalse(result.isEmpty());
    }
}
