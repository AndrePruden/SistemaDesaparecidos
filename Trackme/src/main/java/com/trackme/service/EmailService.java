package com.trackme.service;

import com.trackme.model.Avistamiento;
import com.trackme.model.PersonaDesaparecida;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String FROM_EMAIL = "no-reply@trackme.com";
    private static final String SITE_URL = "https://trackmeucb.netlify.app/";

    @Autowired
    private JavaMailSender mailSender;

    public void sendSightingNotification(PersonaDesaparecida reporte, Avistamiento avistamiento) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(FROM_EMAIL);
            message.setTo(reporte.getEmailReportaje());
            message.setSubject("Nuevo avistamiento de " + reporte.getNombre());

            String ubicacionMapa = "https://www.google.com/maps?q=" + avistamiento.getUbicacion().replace(" ", "");

            String emailText = "Se hizo un avistamiento de la persona que reportaste desaparecida:\n\n" +
                    "Nombre: " + reporte.getNombre() + "\n" +
                    "Fecha del avistamiento: " + formatDate(avistamiento.getFecha()) + "\n" +
                    "Descripción: " + (avistamiento.getDescripcion() != null ? avistamiento.getDescripcion() : "No proporcionada") + "\n\n" +
                    "Ubicación reportada: " + avistamiento.getUbicacion() + "\n" +
                    "Ver en mapa: " + ubicacionMapa + "\n\n" +
                    "Puedes ver más detalles en nuestra plataforma: " + SITE_URL + "\n\n" +
                    "Este es un mensaje automático, por favor no responda a este correo.";

            message.setText(emailText);

            mailSender.send(message);
            logger.info("Email de notificación enviado a: {}", reporte.getEmailReportaje());
        } catch (Exception e) {
            logger.error("Error al enviar email a {}: {}", reporte.getEmailReportaje(), e.getMessage());
            throw new RuntimeException("Error enviando notificación por email", e);
        }
    }

    private String formatDate(java.util.Date date) {
        if (date == null) {
            return "Fecha no especificada";
        }
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy 'a las' HH:mm");
        return sdf.format(date);
    }

    public void enviarCodigo(String destinatario, String codigo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatario);
        mensaje.setSubject("Tu código de verificación");
        mensaje.setText("Tu código de verificación es: " + codigo);
        mailSender.send(mensaje);
    }
}