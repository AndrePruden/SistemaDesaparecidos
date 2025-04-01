package com.trackme.service;

import com.trackme.model.Usuario;
import com.trackme.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder; // Encriptador de contraseñas

    @Autowired
    public UsuarioService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Optional<Usuario> obtenerUsuarioPorEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<Usuario> obtenerUsuarioPorId(Long id) {
        return userRepository.findById(id);
    }

    public Usuario crearUsuario(Usuario usuario) {
        String contraseñaEncriptada = passwordEncoder.encode(usuario.getPassword());
        usuario.setPassword(contraseñaEncriptada);
        return userRepository.save(usuario);
    }

    public Usuario actualizarUsuario(Usuario usuario) {
        if (usuario.getPassword() != null && !usuario.getPassword().isEmpty()) {
            String contraseñaEncriptada = passwordEncoder.encode(usuario.getPassword());
            usuario.setPassword(contraseñaEncriptada);
        }
        return userRepository.save(usuario);
    }

    public boolean verificarContraseña(String contraseñaIngresada, String contraseñaEncriptada) {
        return passwordEncoder.matches(contraseñaIngresada, contraseñaEncriptada);
    }

    public void eliminarUsuario(Long id) {
        userRepository.findById(id).ifPresent(userRepository::delete);
    }
}