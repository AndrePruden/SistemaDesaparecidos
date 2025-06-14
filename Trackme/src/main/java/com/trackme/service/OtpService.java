package com.trackme.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();
    private final int EXPIRACION_MINUTOS = 3;

    public String generarOtp(String email) {
        String codigo = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, new OtpEntry(codigo, LocalDateTime.now().plusMinutes(EXPIRACION_MINUTOS)));
        return codigo;
    }

    public boolean verificarOtp(String email, String codigoIngresado) {
        OtpEntry entry = otpStorage.get(email);
        if (entry == null || LocalDateTime.now().isAfter(entry.expira)) {
            return false;
        }
        return entry.codigo.equals(codigoIngresado);
    }

    private static class OtpEntry {
        String codigo;
        LocalDateTime expira;

        OtpEntry(String codigo, LocalDateTime expira) {
            this.codigo = codigo;
            this.expira = expira;
        }
    }
}
