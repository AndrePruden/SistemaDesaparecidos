package com.trackme.service;

import com.trackme.model.PersonaDesaparecida;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class ReporteValidationService {

    private static final int MIN_NOMBRE_LENGTH = 2;
    private static final int MAX_EDAD = 200;
    private static final int MIN_AÑO_DESAPARICION = 2024;

    public String validarReporte(PersonaDesaparecida reporte) {
        if (reporte.getNombre() == null || reporte.getNombre().trim().isEmpty()) {
            return "El nombre no puede estar vacío";
        }
        if (reporte.getNombre().length() < MIN_NOMBRE_LENGTH) {
            return "El nombre debe tener al menos " + MIN_NOMBRE_LENGTH + " caracteres";
        }
        if (Pattern.compile("[0-9]").matcher(reporte.getNombre()).find()) {
            return "El nombre no puede contener números";
        }

        if (reporte.getEdad() == null) {
            return "La edad no puede estar vacía";
        }
        if (reporte.getEdad() <= 0) {
            return "La edad debe ser mayor a 0";
        }
        if (reporte.getEdad() > MAX_EDAD) {
            return "La edad no puede ser mayor a " + MAX_EDAD;
        }

        if (reporte.getFechaDesaparicion() != null) {
            int year = reporte.getFechaDesaparicion().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate().getYear();
            if (year < MIN_AÑO_DESAPARICION) {
                return "El año de desaparición debe ser " + MIN_AÑO_DESAPARICION + " o superior";
            }
        }

        if (reporte.getLugarDesaparicion() == null || reporte.getLugarDesaparicion().trim().isEmpty()) {
            return "El lugar de desaparición no puede estar vacío";
        }

        if (reporte.getDescripcion() != null && reporte.getDescripcion().trim().isEmpty()) {
            return "La descripción no puede contener solo espacios";
        }

        if (reporte.getEmailReportaje() == null || reporte.getEmailReportaje().trim().isEmpty()) {
            return "El email es requerido";
        }

        return null;
    }
}
