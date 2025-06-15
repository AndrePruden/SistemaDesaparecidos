package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.DesaparecidoOficial;
import com.trackme.model.PersonaDesaparecida;
import com.trackme.repository.AvistamientoRepository;
import com.trackme.repository.DesaparecidoOficialRepository;
import com.trackme.repository.ReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock
    private ReporteRepository reporteRepository;

    @Mock
    private DesaparecidoOficialRepository desaparecidoOficialRepository;

    @Mock
    private AvistamientoRepository avistamientoRepository;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private ReporteService reporteService;

    @TempDir
    Path tempDir;

    private PersonaDesaparecida personaDesaparecida;
    private DesaparecidoOficial desaparecidoOficial;
    private LocalDate fechaDesaparicion;

    @BeforeEach
    void setUp() {
        fechaDesaparicion = LocalDate.of(2024, 1, 15);

        personaDesaparecida = new PersonaDesaparecida();
        personaDesaparecida.setIdDesaparecido(1L);
        personaDesaparecida.setNombre("Juan Pérez");
        personaDesaparecida.setEdad(25);
        personaDesaparecida.setEmailReportaje("reporter@example.com");
        personaDesaparecida.setLugarDesaparicion("La Paz");
        personaDesaparecida.setDescripcion("Descripción del caso");
        personaDesaparecida.setFechaDesaparicion(Date.from(fechaDesaparicion.atStartOfDay(ZoneId.systemDefault()).toInstant()));

        desaparecidoOficial = new DesaparecidoOficial();
        desaparecidoOficial.setNombre("Juan Pérez");
    }

    @Test
    void testCrearReporte_Success() {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Arrays.asList(desaparecidoOficial));
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(personaDesaparecida);
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(new Avistamiento());

        PersonaDesaparecida resultado = reporteService.crearReporte(
                "Juan Pérez", 25, fechaDesaparicion, "La Paz",
                "Descripción del caso", "reporter@example.com", null);

        assertNotNull(resultado);
        verify(reporteRepository, times(1)).save(any(PersonaDesaparecida.class));
        verify(avistamientoRepository, times(1)).save(any(Avistamiento.class));

        ArgumentCaptor<PersonaDesaparecida> reporteCaptor = ArgumentCaptor.forClass(PersonaDesaparecida.class);
        verify(reporteRepository).save(reporteCaptor.capture());

        PersonaDesaparecida reporteGuardado = reporteCaptor.getValue();
        assertEquals("Juan Pérez", reporteGuardado.getNombre());
        assertEquals(25, reporteGuardado.getEdad());
        assertEquals("La Paz", reporteGuardado.getLugarDesaparicion());
        assertEquals("reporter@example.com", reporteGuardado.getEmailReportaje());
    }

    @Test
    void testCrearReporte_PersonaNoValida() {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Collections.emptyList());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reporteService.crearReporte("Juan Pérez", 25, fechaDesaparicion, "La Paz",
                    "Descripción del caso", "reporter@example.com", null);
        });

        assertEquals("La persona no está registrada en la página de la policía boliviana de desaparecidos.",
                exception.getMessage());
        verify(reporteRepository, never()).save(any());
        verify(avistamientoRepository, never()).save(any());
    }

    @Test
    void testCrearReporte_ConImagen_Success() throws IOException {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Arrays.asList(desaparecidoOficial));
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(personaDesaparecida);
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(new Avistamiento());

        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getOriginalFilename()).thenReturn("test.jpg");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("test content".getBytes()));

        PersonaDesaparecida resultado = reporteService.crearReporte(
                "Juan Pérez", 25, fechaDesaparicion, "La Paz",
                "Descripción del caso", "reporter@example.com", multipartFile);

        assertNotNull(resultado);
        verify(reporteRepository, times(1)).save(any(PersonaDesaparecida.class));

        ArgumentCaptor<PersonaDesaparecida> reporteCaptor = ArgumentCaptor.forClass(PersonaDesaparecida.class);
        verify(reporteRepository).save(reporteCaptor.capture());

        PersonaDesaparecida reporteGuardado = reporteCaptor.getValue();
        assertNotNull(reporteGuardado.getImagen());
        assertTrue(reporteGuardado.getImagen().contains("sistemadesaparecidos-production.up.railway.app/uploads/"));
    }

    @Test
    void testCrearReporte_ConImagenVacia() {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Arrays.asList(desaparecidoOficial));
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(personaDesaparecida);
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(new Avistamiento());
        when(multipartFile.isEmpty()).thenReturn(true);

        PersonaDesaparecida resultado = reporteService.crearReporte(
                "Juan Pérez", 25, fechaDesaparicion, "La Paz",
                "Descripción del caso", "reporter@example.com", multipartFile);

        assertNotNull(resultado);
        verify(reporteRepository, times(1)).save(any(PersonaDesaparecida.class));
    }

    @Test
    void testCrearReporte_ErrorGuardarImagen() throws IOException {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Arrays.asList(desaparecidoOficial));
        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getOriginalFilename()).thenReturn("test.jpg");
        when(multipartFile.getInputStream()).thenThrow(new IOException("Error de IO"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reporteService.crearReporte("Juan Pérez", 25, fechaDesaparicion, "La Paz",
                    "Descripción del caso", "reporter@example.com", multipartFile);
        });

        assertEquals("Error al guardar imagen.", exception.getMessage());
        verify(reporteRepository, never()).save(any());
    }

    @Test
    void testCrearAvistamientoInicial_Success() {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Arrays.asList(desaparecidoOficial));
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(personaDesaparecida);
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(new Avistamiento());

        reporteService.crearReporte("Juan Pérez", 25, fechaDesaparicion, "La Paz",
                "Descripción del caso", "reporter@example.com", null);

        ArgumentCaptor<Avistamiento> avistamientoCaptor = ArgumentCaptor.forClass(Avistamiento.class);
        verify(avistamientoRepository).save(avistamientoCaptor.capture());

        Avistamiento avistamientoGuardado = avistamientoCaptor.getValue();
        assertEquals("reporter@example.com", avistamientoGuardado.getEmailUsuario());
        assertEquals("La Paz", avistamientoGuardado.getUbicacion());
        assertTrue(avistamientoGuardado.getDescripcion().startsWith("Reporte inicial - "));
    }

    @Test
    void testCrearAvistamientoInicial_ConExcepcion() {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Arrays.asList(desaparecidoOficial));
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(personaDesaparecida);
        when(avistamientoRepository.save(any(Avistamiento.class)))
                .thenThrow(new RuntimeException("Error en base de datos"));

        assertDoesNotThrow(() -> {
            reporteService.crearReporte("Juan Pérez", 25, fechaDesaparicion, "La Paz",
                    "Descripción del caso", "reporter@example.com", null);
        });

        verify(avistamientoRepository, times(1)).save(any(Avistamiento.class));
    }

    @Test
    void testObtenerReportesPorEmail() {
        List<PersonaDesaparecida> reportesEsperados = Arrays.asList(personaDesaparecida);
        when(reporteRepository.findByEmailReportaje("reporter@example.com"))
                .thenReturn(reportesEsperados);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesPorEmail("reporter@example.com");

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
        verify(reporteRepository, times(1)).findByEmailReportaje("reporter@example.com");
    }

    @Test
    void testObtenerTodosLosReportes() {
        List<PersonaDesaparecida> reportesEsperados = Arrays.asList(personaDesaparecida);
        when(reporteRepository.findAll()).thenReturn(reportesEsperados);

        List<PersonaDesaparecida> resultado = reporteService.obtenerTodosLosReportes();

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
        verify(reporteRepository, times(1)).findAll();
    }

    @Test
    void testObtenerReportesFiltrados_PorNombre() {
        PersonaDesaparecida persona2 = new PersonaDesaparecida();
        persona2.setNombre("María González");
        persona2.setEdad(30);

        List<PersonaDesaparecida> todosReportes = Arrays.asList(personaDesaparecida, persona2);
        when(reporteRepository.findAll()).thenReturn(todosReportes);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesFiltrados("juan", null, null, null);
        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
    }

    @Test
    void testObtenerReportesFiltrados_PorEdad() {
        PersonaDesaparecida persona2 = new PersonaDesaparecida();
        persona2.setNombre("María González");
        persona2.setEdad(30);

        List<PersonaDesaparecida> todosReportes = Arrays.asList(personaDesaparecida, persona2);
        when(reporteRepository.findAll()).thenReturn(todosReportes);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesFiltrados(null, 25, null, null);

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
    }

    @Test
    void testObtenerReportesFiltrados_PorLugar() {
        PersonaDesaparecida persona2 = new PersonaDesaparecida();
        persona2.setNombre("María González");
        persona2.setLugarDesaparicion("Santa Cruz");

        List<PersonaDesaparecida> todosReportes = Arrays.asList(personaDesaparecida, persona2);
        when(reporteRepository.findAll()).thenReturn(todosReportes);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesFiltrados(null, null, "la paz", null);

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
    }

    @Test
    void testObtenerReportesFiltrados_PorFecha() {
        PersonaDesaparecida persona2 = new PersonaDesaparecida();
        persona2.setNombre("María González");
        persona2.setFechaDesaparicion(Date.from(LocalDate.of(2024, 2, 15).atStartOfDay(ZoneId.systemDefault()).toInstant()));

        List<PersonaDesaparecida> todosReportes = Arrays.asList(personaDesaparecida, persona2);
        when(reporteRepository.findAll()).thenReturn(todosReportes);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesFiltrados(null, null, null, fechaDesaparicion);

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
    }

    @Test
    void testObtenerReportesFiltrados_MultipleFiltros() {
        PersonaDesaparecida persona2 = new PersonaDesaparecida();
        persona2.setNombre("Juan García");
        persona2.setEdad(25);
        persona2.setLugarDesaparicion("Santa Cruz");
        persona2.setFechaDesaparicion(Date.from(fechaDesaparicion.atStartOfDay(ZoneId.systemDefault()).toInstant()));

        List<PersonaDesaparecida> todosReportes = Arrays.asList(personaDesaparecida, persona2);
        when(reporteRepository.findAll()).thenReturn(todosReportes);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesFiltrados("juan", 25, "la paz", fechaDesaparicion);

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
    }

    @Test
    void testObtenerReportesFiltrados_SinFiltros() {
        List<PersonaDesaparecida> todosReportes = Arrays.asList(personaDesaparecida);
        when(reporteRepository.findAll()).thenReturn(todosReportes);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesFiltrados(null, null, null, null);

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
    }

    @Test
    void testObtenerReportesFiltrados_FiltrosVacios() {
        List<PersonaDesaparecida> todosReportes = Arrays.asList(personaDesaparecida);
        when(reporteRepository.findAll()).thenReturn(todosReportes);

        List<PersonaDesaparecida> resultado = reporteService.obtenerReportesFiltrados("", null, "", null);

        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
    }

    @Test
    void testArchivarReporte_Success() {
        when(reporteRepository.findById(1L)).thenReturn(Optional.of(personaDesaparecida));
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(personaDesaparecida);

        reporteService.archivarReporte(1L);

        ArgumentCaptor<PersonaDesaparecida> reporteCaptor = ArgumentCaptor.forClass(PersonaDesaparecida.class);
        verify(reporteRepository).save(reporteCaptor.capture());

        PersonaDesaparecida reporteArchivado = reporteCaptor.getValue();
        assertFalse(reporteArchivado.getEstado());
    }

    @Test
    void testArchivarReporte_ReporteNoEncontrado() {
        when(reporteRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reporteService.archivarReporte(1L);
        });

        assertEquals("Reporte no encontrado con ID: 1", exception.getMessage());
        verify(reporteRepository, never()).save(any());
    }

    @Test
    void testEsPersonaValida_PersonaEncontrada() {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Juan Pérez"))
                .thenReturn(Arrays.asList(desaparecidoOficial));
        when(reporteRepository.save(any(PersonaDesaparecida.class))).thenReturn(personaDesaparecida);
        when(avistamientoRepository.save(any(Avistamiento.class))).thenReturn(new Avistamiento());

        PersonaDesaparecida resultado = reporteService.crearReporte(
                "Juan Pérez", 25, fechaDesaparicion, "La Paz",
                "Descripción del caso", "reporter@example.com", null);

        assertNotNull(resultado);
        verify(desaparecidoOficialRepository).findByNombreContainingIgnoreCase("Juan Pérez");
    }

    @Test
    void testEsPersonaValida_PersonaNoEncontrada() {
        when(desaparecidoOficialRepository.findByNombreContainingIgnoreCase("Persona Inexistente"))
                .thenReturn(Collections.emptyList());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reporteService.crearReporte("Persona Inexistente", 25, fechaDesaparicion, "La Paz",
                    "Descripción del caso", "reporter@example.com", null);
        });

        assertTrue(exception.getMessage().contains("no está registrada en la página de la policía boliviana"));
        verify(desaparecidoOficialRepository).findByNombreContainingIgnoreCase("Persona Inexistente");
    }
}