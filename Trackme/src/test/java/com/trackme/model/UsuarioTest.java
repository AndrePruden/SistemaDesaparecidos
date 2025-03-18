package com.trackme.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class UsuarioTest {

    @ParameterizedTest
    @CsvSource({
            "1, test@example.com, Test User, 123456",
            "2, user@domain.com, Another User, password123"
    })
    void testUsuarioGettersAndSetters(Long id, String email, String nombre, String password) {
        // Crear el objeto Usuario sin constructor
        Usuario usuario = new Usuario();

        // Usar setters para asignar valores
        usuario.setId(id);
        usuario.setEmail(email);
        usuario.setNombre(nombre);
        usuario.setPassword(password);

        // Verificar que los valores asignados por los setters sean correctos
        assertEquals(id, usuario.getId());
        assertEquals(email, usuario.getEmail());
        assertEquals(nombre, usuario.getNombre());
        assertEquals(password, usuario.getPassword());

        // Probando setters adicionales
        usuario.setId(3L);
        usuario.setEmail("new@example.com");
        usuario.setNombre("New User");
        usuario.setPassword("newpassword");

        assertEquals(3L, usuario.getId());
        assertEquals("new@example.com", usuario.getEmail());
        assertEquals("New User", usuario.getNombre());
        assertEquals("newpassword", usuario.getPassword());
    }

    @Test
    void testSettersIndependientes() {
        // Crear el objeto Usuario sin constructor
        Usuario usuario = new Usuario();

        // Asignar valores usando los setters
        usuario.setId(1L);
        usuario.setEmail("test@example.com");
        usuario.setNombre("Test User");
        usuario.setPassword("123456");

        // Verificar que los valores asignados sean correctos
        usuario.setId(10L);
        assertEquals(10L, usuario.getId());

        usuario.setEmail("change@example.com");
        assertEquals("change@example.com", usuario.getEmail());

        usuario.setNombre("Changed Name");
        assertEquals("Changed Name", usuario.getNombre());

        usuario.setPassword("newpass");
        assertEquals("newpass", usuario.getPassword());
    }
}
