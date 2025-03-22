package com.trackme.service;

import com.trackme.model.Usuario;
import com.trackme.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    private final UserRepository userRepository;

    @Autowired
    public UsuarioService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<Usuario> obtenerUsuarioPorEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<Usuario> obtenerUsuarioPorId(Long id) {
        return userRepository.findById(id);
    }

    public Usuario crearUsuario(Usuario usuario) {
        return userRepository.save(usuario);
    }

    public Usuario actualizarUsuario(Usuario usuario) {
        return userRepository.save(usuario);
    }

    public void eliminarUsuario(Long id) {
        userRepository.findById(id).ifPresent(userRepository::delete);
    }
}