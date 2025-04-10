package com.trackme.controller;

import com.trackme.model.Usuario;
import com.trackme.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UsuarioService usuarioService;

    // Registrar nuevo usuario
    @PostMapping("/registro")
    public ResponseEntity<ResponseMessage> registrarUsuario(@RequestBody Usuario usuario) {
        try {
            // Verifica si el correo ya está registrado
            if (usuarioService.obtenerUsuarioPorEmail(usuario.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(new ResponseMessage("El correo ya está registrado."));
            }
            usuarioService.crearUsuario(usuario);

            return ResponseEntity.ok(new ResponseMessage("Usuario registrado con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ResponseMessage("Hubo un error al registrar el usuario: " + e.getMessage()));
        }
    }


    @PostMapping("/iniciar-sesion")
    public ResponseEntity<ResponseMessage> iniciarSesion(@RequestBody Usuario usuario) {
        Optional<Usuario> existingUser = usuarioService.obtenerUsuarioPorEmail(usuario.getEmail());

        if (!existingUser.isPresent()) {
            return ResponseEntity.status(404).body(new ResponseMessage("El correo electrónico no está registrado."));
        }

        if (usuarioService.verificarContraseña(usuario.getPassword(), existingUser.get().getPassword())) {
            return ResponseEntity.ok(new ResponseMessage("Inicio de sesión exitoso."));
        }

        return ResponseEntity.status(401).body(new ResponseMessage("Contraseña incorrecta."));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        if (usuarioService.obtenerUsuarioPorId(id).isPresent()) {
            usuarioService.eliminarUsuario(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        Optional<Usuario> existingUser = usuarioService.obtenerUsuarioPorId(id);
        if (existingUser.isPresent()) {
            usuario.setId(id); // Asegurarse de que no cambie el ID
            Usuario usuarioActualizado = usuarioService.actualizarUsuario(usuario);
            return ResponseEntity.ok(usuarioActualizado);
        }
        return ResponseEntity.notFound().build();
    }
}
