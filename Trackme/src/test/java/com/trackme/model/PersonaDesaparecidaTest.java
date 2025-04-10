package com.trackme.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import jakarta.persistence.*;
import java.lang.reflect.Field;
import java.lang.annotation.Annotation; // Importación añadida
import java.util.Date;

public class PersonaDesaparecidaTest {

    @Test
    public void testGettersAndSetters() {
        PersonaDesaparecida persona = new PersonaDesaparecida();
        
        Long id = 1L;
        String email = "andrepruden@gmail.com";
        String nombre = "AndrePruden";
        Integer edad = 21;
        Date fechaDesaparicion = new Date();
        String lugar = "CBBA";
        String descripcion = "Estatura media, pelo negro, última vez visto con camisa roja";
        
        persona.setIdDesaparecido(id);
        persona.setEmailReportaje(email);
        persona.setNombre(nombre);
        persona.setEdad(edad);
        persona.setFechaDesaparicion(fechaDesaparicion);
        persona.setLugarDesaparicion(lugar);
        persona.setDescripcion(descripcion);
        
        assertEquals(id, persona.getIdDesaparecido());
        assertEquals(email, persona.getEmailReportaje());
        assertEquals(nombre, persona.getNombre());
        assertEquals(edad, persona.getEdad());
        assertEquals(fechaDesaparicion, persona.getFechaDesaparicion());
        assertEquals(lugar, persona.getLugarDesaparicion());
        assertEquals(descripcion, persona.getDescripcion());
    }

    @Test
    public void testEntityAnnotations() {
        Entity entityAnnotation = PersonaDesaparecida.class.getAnnotation(Entity.class);
        assertNotNull(entityAnnotation, "La clase debe tener anotación @Entity");
        
        Table tableAnnotation = PersonaDesaparecida.class.getAnnotation(Table.class);
        assertNotNull(tableAnnotation, "La clase debe tener anotación @Table");
        assertEquals("persona_desaparecida", tableAnnotation.name(), "El nombre de la tabla debe coincidir");
    }

    @Test
    public void testFieldAnnotations() throws NoSuchFieldException {
        checkFieldAnnotation("idDesaparecido", Id.class);
        checkFieldAnnotation("idDesaparecido", GeneratedValue.class);
        
        checkColumnAnnotation("emailReportaje", false, 100);
        checkColumnAnnotation("nombre", false, 100);
        checkColumnAnnotation("fechaDesaparicion", false, -1);
        checkColumnAnnotation("lugarDesaparicion", false, 255);
        checkColumnAnnotation("descripcion", true, -1);
    }

    private <T extends Annotation> void checkFieldAnnotation(String fieldName, Class<T> annotationClass) 
            throws NoSuchFieldException {
        Field field = PersonaDesaparecida.class.getDeclaredField(fieldName);
        T annotation = field.getAnnotation(annotationClass);
        assertNotNull(annotation, 
            "El campo " + fieldName + " debe tener anotación @" + annotationClass.getSimpleName());
    }

    private void checkColumnAnnotation(String fieldName, boolean nullable, int length) 
            throws NoSuchFieldException {
        Field field = PersonaDesaparecida.class.getDeclaredField(fieldName);
        Column column = field.getAnnotation(Column.class);
        assertNotNull(column, "El campo " + fieldName + " debe tener anotación @Column");
        
        if (nullable) {
            assertTrue(column.nullable(), "El campo " + fieldName + " debe ser nullable");
        } else {
            assertFalse(column.nullable(), "El campo " + fieldName + " no debe ser nullable");
        }
        
        if (length > 0) {
            assertEquals(length, column.length(), "El campo " + fieldName + " debe tener length=" + length);
        }
    }

    @Test
    public void testTemporalAnnotation() throws NoSuchFieldException {
        Field field = PersonaDesaparecida.class.getDeclaredField("fechaDesaparicion");
        Temporal temporal = field.getAnnotation(Temporal.class);
        assertNotNull(temporal, "El campo fechaDesaparicion debe tener anotación @Temporal");
        assertEquals(TemporalType.DATE, temporal.value(), "El campo fechaDesaparicion debe ser DATE");
    }

    @Test
    public void testColumnDefinition() throws NoSuchFieldException {
        Field field = PersonaDesaparecida.class.getDeclaredField("descripcion");
        Column column = field.getAnnotation(Column.class);
        assertEquals("TEXT", column.columnDefinition(), "El campo descripcion debe tener columnDefinition=TEXT");
    }
}