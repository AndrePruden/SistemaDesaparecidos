package com.trackme.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.ReporteRepository;
import com.trackme.repository.UserRepository;
import com.trackme.service.FeatureToggleService;
import com.trackme.service.ReporteService;
import com.trackme.service.ReporteValidationService;
import com.trackme.service.ScrapingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

import static org.springframework.test.util.AssertionErrors.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "feature.create-reports.enabled=true")
class ReporteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ReporteRepository reporteRepository;

    @Autowired
    private UserRepository usuarioRepository;

    @Autowired
    private FeatureToggleService featureToggleService;

    @Autowired
    private ScrapingService scrapingService;

    private final String testEmail = "test@example.com";

    @TestConfiguration
    static class TestConfig {
        @Bean
        public ReporteService personaDesaparecidaService() {
            return new ReporteService() {
                @Override
                public PersonaDesaparecida crearReporte(PersonaDesaparecida persona) {
                    if (!persona.getNombre().equals("Maria")) {
                        throw new RuntimeException("La persona debe estar registrada oficialmente en la página de la Policía Boliviana.");
                    }
                    return persona;
                }

                @Override
                public List<PersonaDesaparecida> obtenerReportesPorEmail(String email) {
                    PersonaDesaparecida persona = new PersonaDesaparecida();
                    persona.setNombre("Maria");
                    persona.setEdad(25);
                    persona.setLugarDesaparicion("Cochabamba");
                    persona.setDescripcion("Desaparecida");
                    persona.setEmailReportaje(email);
                    persona.setFechaDesaparicion(Date.from(LocalDate.of(2025, 4, 10)
                            .atStartOfDay(ZoneId.systemDefault()).toInstant()));
                    return List.of(persona);
                }

                @Override
                public List<PersonaDesaparecida> obtenerTodosLosReportes() {
                    PersonaDesaparecida persona = new PersonaDesaparecida();
                    persona.setNombre("Carlos");
                    persona.setEdad(40);
                    persona.setLugarDesaparicion("La Paz");
                    persona.setDescripcion("Desaparecido");
                    persona.setEmailReportaje("carlos@email.com");
                    persona.setFechaDesaparicion(Date.from(LocalDate.of(2025, 3, 15)
                            .atStartOfDay(ZoneId.systemDefault()).toInstant()));
                    return List.of(persona);
                }
            };
        }

        @Bean
        public ReporteValidationService reporteValidationService() {
            return new ReporteValidationService() {
                @Override
                public String validarReporte(PersonaDesaparecida persona) {
                    return null;
                }
            };
        }
    }

    @Test
    public void testCrearReporteConToggleDesactivado() throws Exception {
        featureToggleService.setFeatureEnabled("create-reports", false);

        PersonaDesaparecida reporte = new PersonaDesaparecida();
        reporte.setNombre("Carlos");
        reporte.setEdad(30);
        reporte.setEmailReportaje(testEmail);
        reporte.setFechaDesaparicion(Date.from(LocalDate.of(2025, 4, 10)
                .atStartOfDay(ZoneId.systemDefault()).toInstant()));
        reporte.setLugarDesaparicion("Ciudad");
        reporte.setDescripcion("Desaparecido en zona urbana");

        mockMvc.perform(post("/reportes/crear")
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .param("nombre", reporte.getNombre())
                        .param("edad", String.valueOf(reporte.getEdad()))
                        .param("fechaDesaparicion", reporte.getFechaDesaparicion().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString())
                        .param("lugarDesaparicion", reporte.getLugarDesaparicion())
                        .param("descripcion", reporte.getDescripcion())
                        .param("emailReportaje", reporte.getEmailReportaje()))
                .andExpect(status().isForbidden())
                .andExpect(content().string("La creación de reportes está deshabilitada para usuarios no logueados."));
    }

    @Test
    public void testCrearReporteParaPersonaExistente() throws Exception {
        String nombre = "Ely Aleyda Nina Yana";
        Integer edad = 30;
        String lugarDesaparicion = "Cochabamba";
        String descripcion = "Desaparecido en la zona central";
        String emailReportaje = "test@example.com";
        LocalDate fechaDesaparicion = LocalDate.of(2025, 4, 25);

        boolean personaEncontrada = scrapingService.verificarPersonaDesaparecida(nombre);

        assertTrue("La persona está en la página de desaparecidos", personaEncontrada);
    }

    @Test
    public void testCrearReporteParaPersonaNoExistente() throws Exception {
        String nombre = "Carlos Torres";
        Integer edad = 40;
        String lugarDesaparicion = "La Paz";
        String descripcion = "Desaparecido en zona rural";
        String emailReportaje = "test@example.com";
        LocalDate fechaDesaparicion = LocalDate.of(2025, 4, 25);

        mockMvc.perform(post("/reportes/crear")
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .param("nombre", nombre)
                        .param("edad", String.valueOf(edad))
                        .param("fechaDesaparicion", fechaDesaparicion.toString())
                        .param("lugarDesaparicion", lugarDesaparicion)
                        .param("descripcion", descripcion)
                        .param("emailReportaje", emailReportaje))
                .andExpect(status().isForbidden())
                .andExpect(content().string("La persona no está registrada en la página de la policía boliviana de desaparecidos"));
    }

//    @Test
//    public void testObtenerReportesPorUsuario() throws Exception {
//        PersonaDesaparecida reporte = new PersonaDesaparecida();
//        reporte.setNombre("Carlos");
//        reporte.setEdad(30);
//        reporte.setEmailReportaje(testEmail);
//        reporte.setFechaDesaparicion(Date.from(LocalDate.of(2023, 1, 1)
//                .atStartOfDay(ZoneId.systemDefault()).toInstant()));
//        reporte.setLugarDesaparicion("Ciudad");
//        reporte.setDescripcion("Desaparecido en zona urbana");
//        reporteRepository.save(reporte);
//
//        mockMvc.perform(get("/reportes/usuario/" + testEmail))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].nombre").value("Carlos"));
//    }

//     @Test
//     public void testObtenerTodosLosReportes() throws Exception {
//         PersonaDesaparecida reporte = new PersonaDesaparecida();
//         reporte.setNombre("Carlos");
//         reporte.setEdad(30);
//         reporte.setEmailReportaje(testEmail);
//         reporte.setFechaDesaparicion(Date.from(LocalDate.of(2025, 3, 15)
//                 .atStartOfDay(ZoneId.systemDefault()).toInstant()));
//         reporte.setLugarDesaparicion("Ciudad");
//         reporte.setDescripcion("Desaparecido en zona urbana");
//         reporteRepository.save(reporte);
//
//         mockMvc.perform(get("/reportes"))
//                 .andExpect(status().isOk())
//                 .andExpect(jsonPath("$[0].nombre").value("Carlos"));
//     }
}
