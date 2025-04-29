package com.trackme.controller;

import com.trackme.model.PersonaDesaparecida;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.ReporteService;
import com.trackme.service.ReporteValidationService;
import com.trackme.service.ScrapingService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.util.AssertionErrors.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
//    public void testCrearReporteParaPersonaExistente() throws Exception {
//        String nombre = "WIMAR CALDERON THOLA";
//        Integer edad = 30;
//        String lugarDesaparicion = "Cochabamba";
//        String descripcion = "Desaparecido en la zona central";
//        String emailReportaje = "test@example.com";
//        LocalDate fechaDesaparicion = LocalDate.of(2025, 4, 25);
//        boolean personaEncontrada = scrapingService.verificarPersonaDesaparecida(nombre);
//
//        assertTrue("La persona no está en la página de desaparecidos", personaEncontrada);
//
//        if (personaEncontrada) {
//            mockMvc.perform(post("/reportes/crear")
//                            .contentType(MediaType.MULTIPART_FORM_DATA)
//                            .param("nombre", nombre)
//                            .param("edad", String.valueOf(edad))
//                            .param("fechaDesaparicion", fechaDesaparicion.toString())
//                            .param("lugarDesaparicion", lugarDesaparicion)
//                            .param("descripcion", descripcion)
//                            .param("emailReportaje", emailReportaje))
//                    .andExpect(status().isOk())  // Esperamos que la respuesta sea 200 OK
//                    .andExpect(jsonPath("$.nombre").value(nombre))  // Verificar que el nombre esté en el reporte
//                    .andExpect(jsonPath("$.edad").value(edad))  // Verificar que la edad esté correcta
//                    .andExpect(jsonPath("$.lugarDesaparicion").value(lugarDesaparicion))  // Verificar lugar
//                    .andExpect(jsonPath("$.descripcion").value(descripcion))  // Verificar descripción
//                    .andExpect(jsonPath("$.emailReportaje").value(emailReportaje));  // Verificar email
//        }
//    }


//    @Test
//    void testCrearReporte_ErrorPorPersonaNoValida() throws Exception {
//        // Arrange
//        when(featureToggleService.isCreateReportsEnabled()).thenReturn(true);
//        when(scrapingService.verificarPersonaDesaparecida("Juan Perez")).thenReturn(false);
//
//        // Act & Assert
//        mockMvc.perform(multipart("/reportes/crear")
//                        .file("file", "dummy data".getBytes())
//                        .param("nombre", "Juan Perez")
//                        .param("edad", "30")
//                        .param("fechaDesaparicion", "2025-04-25")
//                        .param("lugarDesaparicion", "La Paz")
//                        .param("descripcion", "Descripción de prueba")
//                        .param("emailReportaje", "juan@example.com")
//                        .param("isLoggedIn", "true"))
//                .andExpect(status().isForbidden())
//                .andExpect(content().string("La persona no está registrada en la página de la policía boliviana de desaparecidos"));
//    }

    @Test
    void testCrearReporte_FeatureToggleDesactivado() throws Exception {
        // Arrange
        when(featureToggleService.isCreateReportsEnabled()).thenReturn(false);

        // Act & Assert
        mockMvc.perform(multipart("/reportes/crear")
                        .file("file", "dummy data".getBytes())
                        .param("nombre", "Juan Perez")
                        .param("edad", "30")
                        .param("fechaDesaparicion", "2025-04-25")
                        .param("lugarDesaparicion", "La Paz")
                        .param("descripcion", "Descripción de prueba")
                        .param("emailReportaje", "juan@example.com")
                        .param("isLoggedIn", "false"))
                .andExpect(status().isForbidden())
                .andExpect(content().string("La creación de reportes está deshabilitada para usuarios no logueados."));
    }

    @Test
    void testObtenerReportesPorUsuario() throws Exception {
        // Arrange
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEmailReportaje("juan@example.com");

        when(reporteService.obtenerReportesPorEmail("juan@example.com")).thenReturn(List.of(reporte));

        // Act & Assert
        mockMvc.perform(get("/reportes/usuario/juan@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Juan Perez"));
    }

    @Test
    void testObtenerTodosLosReportes() throws Exception {
        // Arrange
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");

        when(reporteService.obtenerTodosLosReportes()).thenReturn(List.of(reporte));

        // Act & Assert
        mockMvc.perform(get("/reportes/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Juan Perez"));
    }

    @Test
    void testObtenerReportesFiltrados() throws Exception {
        // Arrange
        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Juan Perez");
        reporte.setEdad(30);

        when(reporteService.obtenerReportesFiltrados("Juan", 30, null, null)).thenReturn(List.of(reporte));

        // Act & Assert
        mockMvc.perform(get("/reportes/filtrar")
                        .param("nombre", "Juan")
                        .param("edad", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Juan Perez"));
    }
}
