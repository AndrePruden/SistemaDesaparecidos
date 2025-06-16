package com.trackme.service;

import com.trackme.model.Avistamiento;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AvistamientoValidationService {

    public String validarAvistamiento(Avistamiento avistamiento) {
        if (avistamiento == null) {
            return "El avistamiento no puede ser nulo.";
        }

        if (!StringUtils.hasText(avistamiento.getUbicacion())) {
            return "La ubicación es obligatoria.";
        }

        if (!StringUtils.hasText(avistamiento.getDescripcion())) {
            return "La descripción es obligatoria.";
        }

        if (!StringUtils.hasText(avistamiento.getEmailUsuario())) {
            return "El email del reportante es obligatorio.";
        }

        if (avistamiento.getFecha() == null) {
            return "La fecha es obligatoria.";
        }

        return null;
    }
}
