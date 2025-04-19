package com.trackme.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "avistamientos")
public class Avistamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAvistamiento;

    @Column(nullable = false, length = 100)
    private String emailUsuario;

    @ManyToOne
    @JoinColumn(name = "id_persona_desaparecida", nullable = false)
    private PersonaDesaparecida personaDesaparecida;

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date fecha;

    @Column(nullable = false, length = 255)
    private String ubicacion;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Getters y Setters
    public Long getIdAvistamiento() { return idAvistamiento; }
    public void setIdAvistamiento(Long idAvistamiento) { this.idAvistamiento = idAvistamiento; }
    public String getEmailUsuario() { return emailUsuario; }
    public void setEmailUsuario(String emailUsuario) { this.emailUsuario = emailUsuario; }
    public PersonaDesaparecida getPersonaDesaparecida() { return personaDesaparecida; }
    public void setPersonaDesaparecida(PersonaDesaparecida personaDesaparecida) { this.personaDesaparecida = personaDesaparecida; }
    public Date getFecha() { return fecha; }
    public void setFecha(Date fecha) { this.fecha = fecha; }
    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    @Transient
    public Long getIdPersonaDesaparecida() {
        return personaDesaparecida != null ? personaDesaparecida.getIdDesaparecido() : null;
    }
}