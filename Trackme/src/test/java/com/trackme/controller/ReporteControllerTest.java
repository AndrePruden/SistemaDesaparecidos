package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.ReporteService;
import com.trackme.service.ReporteValidationService;
import com.trackme.service.ScrapingService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "feature.create-reports.enabled=true")
class ReporteControllerTest {

    @Mock
    private ReporteService reporteService;

    @Mock
    private ReporteValidationService reporteValidationService;

    @Mock
    private FeatureToggleService featureToggleService;

    @Mock
    private ScrapingService scrapingService;

    @InjectMocks
    private ReporteController reporteController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(reporteController).build();
    }

//    @Test
//    void testObtenerTodosLosReportes() throws Exception {
//        // Arrange
//        PersonaDesaparecida reporte = new PersonaDesaparecida();
//        reporte.setNombre("Juan Perez");
//
//        when(reporteService.obtenerTodosLosReportes()).thenReturn(List.of(reporte));
//
//        // Act & Assert
//        mockMvc.perform(get("/reportes/todos"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].nombre").value("Juan Perez"));
//    }

//    @Test
//    void testObtenerReportesFiltrados() throws Exception {
//        // Arrange
//        PersonaDesaparecida reporte = new PersonaDesaparecida();
//        reporte.setNombre("Juan Perez");
//        reporte.setEdad(30);
//
//        when(reporteService.obtenerReportesFiltrados("Juan", 30, null, null)).thenReturn(List.of(reporte));
//
//        // Act & Assert
//        mockMvc.perform(get("/reportes/filtrar")
//                        .param("nombre", "Juan")
//                        .param("edad", "30"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].nombre").value("Juan Perez"));
//    }
}