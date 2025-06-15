package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    private PersonaDesaparecida personaDesaparecida;
    private Avistamiento avistamiento;

    @BeforeEach
    void setUp() {
        personaDesaparecida = new PersonaDesaparecida();
        personaDesaparecida.setNombre("Juan Pérez");
        personaDesaparecida.setEmailReportaje("reporter@example.com");

        avistamiento = new Avistamiento();
        avistamiento.setUbicacion("La Paz, Bolivia");
        avistamiento.setFecha(new Date());
        avistamiento.setDescripcion("Visto en el parque central");
    }

    @Test
    void testSendSightingNotification_Success() {
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        emailService.sendSightingNotification(personaDesaparecida, avistamiento);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());

        SimpleMailMessage sentMessage = messageCaptor.getValue();
        assertEquals("no-reply@trackme.com", sentMessage.getFrom());
        assertEquals("reporter@example.com", sentMessage.getTo()[0]);
        assertEquals("Nuevo avistamiento de Juan Pérez", sentMessage.getSubject());
        assertNotNull(sentMessage.getText());
        assertTrue(sentMessage.getText().contains("Juan Pérez"));
        assertTrue(sentMessage.getText().contains("La Paz, Bolivia"));
        assertTrue(sentMessage.getText().contains("Visto en el parque central"));
        assertTrue(sentMessage.getText().contains("https://www.google.com/maps?q=LaPaz,Bolivia"));
        assertTrue(sentMessage.getText().contains("https://trackmeucb.netlify.app/"));
    }

    @Test
    void testSendSightingNotification_WithNullDescription() {
        avistamiento.setDescripcion(null);
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        emailService.sendSightingNotification(personaDesaparecida, avistamiento);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());

        SimpleMailMessage sentMessage = messageCaptor.getValue();
        assertTrue(sentMessage.getText().contains("No proporcionada"));
    }

    @Test
    void testSendSightingNotification_WithNullDate() {
        avistamiento.setFecha(null);
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        emailService.sendSightingNotification(personaDesaparecida, avistamiento);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());

        SimpleMailMessage sentMessage = messageCaptor.getValue();
        assertTrue(sentMessage.getText().contains("Fecha no especificada"));
    }

    @Test
    void testSendSightingNotification_EmailSendingException() {
        doThrow(new RuntimeException("SMTP server error")).when(mailSender).send(any(SimpleMailMessage.class));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            emailService.sendSightingNotification(personaDesaparecida, avistamiento);
        });

        assertEquals("Error enviando notificación por email", exception.getMessage());
        assertNotNull(exception.getCause());
        assertEquals("SMTP server error", exception.getCause().getMessage());
    }

    @Test
    void testSendSightingNotification_UbicacionWithSpaces() {
        avistamiento.setUbicacion("Santa Cruz de la Sierra");
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        emailService.sendSightingNotification(personaDesaparecida, avistamiento);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());

        SimpleMailMessage sentMessage = messageCaptor.getValue();
        assertTrue(sentMessage.getText().contains("https://www.google.com/maps?q=SantaCruzdelaSierra"));
        assertTrue(sentMessage.getText().contains("Santa Cruz de la Sierra"));
    }

    @Test
    void testFormatDate_ValidDate() {
        Date testDate = new Date(1640995200000L); // 2022-01-01 00:00:00 UTC

        emailService.sendSightingNotification(personaDesaparecida, avistamiento);

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    void testEmailContentFormatting() {
        personaDesaparecida.setNombre("María García");
        personaDesaparecida.setEmailReportaje("maria@test.com");
        avistamiento.setUbicacion("Cochabamba");
        avistamiento.setDescripcion("Cerca del mercado");

        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        emailService.sendSightingNotification(personaDesaparecida, avistamiento);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        String emailText = message.getText();

        assertTrue(emailText.contains("Se hizo un avistamiento de la persona que reportaste desaparecida:"));
        assertTrue(emailText.contains("Nombre: María García"));
        assertTrue(emailText.contains("Descripción: Cerca del mercado"));
        assertTrue(emailText.contains("Ubicación reportada: Cochabamba"));
        assertTrue(emailText.contains("Este es un mensaje automático, por favor no responda a este correo."));
        assertTrue(emailText.contains("Ver en mapa: https://www.google.com/maps?q=Cochabamba"));
    }
}