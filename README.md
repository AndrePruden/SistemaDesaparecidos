# TrackMe - Sistema de Gestión de Personas Desaparecidas

TrackMe es un sistema diseñado para gestionar información sobre personas desaparecidas, centralizando datos y facilitando la comunicación entre familiares, autoridades y la comunidad.

![Elevator Pitch](ElevatorPitch.png)


## Características Principales

*   **Registro y Autenticación de Usuarios:** Permite a los usuarios registrarse, iniciar sesión y gestionar su perfil.
*   **Reporte de Personas Desaparecidas:** Los usuarios registrados (o autorizados vía configuración) pueden crear reportes detallados sobre personas desaparecidas, incluyendo información personal, fecha, lugar de desaparición e imagen.
*   **Validación contra Registros Oficiales:** La creación de reportes se valida contra una base de datos de personas oficialmente reportadas como desaparecidas (actualizada automáticamente mediante web scraping).
*   **Registro de Avistamientos:** Los usuarios pueden reportar avistamientos de personas desaparecidas, proporcionando ubicación y detalles del encuentro.
*   **Visualización en Mapa:** Utiliza mapas interactivos (Leaflet) para mostrar el lugar de desaparición reportado y los últimos avistamientos de cada persona.
*   **Filtrado y Búsqueda:** Permite buscar y filtrar reportes y avistamientos por nombre, edad, lugar o fecha para facilitar la búsqueda.
*   **Archivado de Reportes:** El creador de un reporte puede archivar si la persona es encontrada o la información ya no es relevante (requiere inicio de sesión).
*   **Notificaciones Automáticas:** Envía notificaciones por correo electrónico al creador de un reporte cuando se registra un nuevo avistamiento para la persona reportada.
*   **Web Scraping Programado:** Un proceso automático en el backend se encarga de recopilar datos de registros oficiales de personas desaparecidas en la web para mantener actualizada la base de datos de validación.
*   **Feature Toggles:** Permite habilitar o deshabilitar ciertas funcionalidades (como la creación de reportes o avistamientos por usuarios no registrados) a través de la configuración.

## Tecnologías Utilizadas

### Frontend:
- Angular 19
- RxJS
- TypeScript
- Leaflet (con @types/leaflet)
- Angular Material (MatSnackBar, MatDialog, etc.) y SCSS
- Navegacion : Angular Router

### Backend:
- Spring Boot 3.x
- Spring Data JPA
- MySQL
- Java 17
- Spring Security (para hashing de contraseñas con BCrypt)
- Spring Mail
- Jsoup, RestTemplate
- Spring Scheduling (`@EnableScheduling`)
- Clases de validación personalizadas
- Cálculos de distancia (Haversine)

  ## Estructura del Proyecto

El proyecto sigue una arquitectura de dos capas principales:

*   `/frontend`: Contiene la aplicación Angular (basada en componentes standalone, servicios, módulos de routing, etc.).
*   `/backend`: Contiene la aplicación Spring Boot (con controladores, servicios, repositorios, modelos, configuración, etc.).
  

## Instalación y Configuración

Asegúrate de tener instalados:
*   Java 17 o superior
*   Maven
*   Node.js y npm
*   Angular CLI (`npm install -g @angular/cli`)
*   MySQL Server

  
### Backend

1. **Clona el repositorio y accede al directorio del backend:**
   ```sh
   git clone <URL_DEL_REPOSITORIO>
   cd <DIRECTORIO_DEL_BACKEND>
   ```

2. **Asegúrate de tener Java 17 y Maven instalados:**
   ```sh
   winget install --id Oracle.OpenJDK.17
   winget install Apache.Maven
   ```

3. **Configura la Base de Datos:**
   - Asegúrate de tener MySQL instalado y en ejecución.
   - Crea una base de datos llamada `Trackme`.
   - Dentro de la base de datos `Trackme`, crea las siguientes tablas:
   
     ```sql
     CREATE TABLE usuarios (
         id INT AUTO_INCREMENT PRIMARY KEY,
         email VARCHAR(255) NOT NULL UNIQUE,
         nombre VARCHAR(100) NOT NULL,
         password VARCHAR(255) NOT NULL
     );

     CREATE TABLE persona_desaparecida (
         id_desaparecido INT AUTO_INCREMENT PRIMARY KEY,
         email_reportaje VARCHAR(100) NOT NULL,
         nombre VARCHAR(100) NOT NULL,
         edad INT,
         fecha_desaparicion DATE NOT NULL,
         lugar_desaparicion VARCHAR(255) NOT NULL,
         descripcion TEXT,
         imagen TEXT
         FOREIGN KEY (email_reportaje) REFERENCES usuarios(email) ON DELETE CASCADE
     );

     CREATE TABLE avistamientos (
        id_avistamiento BIGINT AUTO_INCREMENT PRIMARY KEY,
        email_usuario VARCHAR(100) NOT NULL,
        id_persona_desaparecida BIGINT NOT NULL,  -- Cambiado a BIGINT
        fecha DATETIME NOT NULL,
        ubicacion VARCHAR(255) NOT NULL,
        descripcion TEXT,
        FOREIGN KEY (email_usuario) REFERENCES usuarios(email) ON DELETE CASCADE,
        FOREIGN KEY (id_persona_desaparecida) REFERENCES persona_desaparecida(id_desaparecido) ON DELETE CASCADE
      );
     ```

     **Configurar Base de Datos Remota (Aiven):**
     -Si prefieres usar una base de datos remota segura:
     -Credenciales 
       Hostname: mysql-1c418c5-ucb-2025.b.aivencloud.com

       Puerto: 16933

       Usuario: avnadmin

       Contraseña: AVNS_v9DsynIVQbxEaz0QX1l
     
     -Configuración SSL
       Descarga el archivo de certificado ca.pem
       En tu cliente MySQL (MySQL Workbench, DBeaver, etc.), ve a la pestaña SSL y en SSL CA File (SSCA) selecciona el archivo ca.pem

     *Archivo application.properties (remoto):*
      ```sh
       spring.datasource.url=jdbc:mysql://mysql-1c418c5-ucb-2025.b.aivencloud.com:16933/Trackme?useSSL=true&requireSSL=true
       spring.datasource.username=avnadmin
       spring.datasource.password=AVNS_v9DsynIVQbxEaz0QX1l
       spring.jpa.hibernate.ddl-auto=update
       spring.jpa.show-sql=true
   ```

4. **Agrega el driver de MySQL en el archivo `pom.xml`:**
   ```xml
   <dependency>
       <groupId>mysql</groupId>
       <artifactId>mysql-connector-java</artifactId>
       <version>8.0.26</version>
   </dependency>
   ```

5. **Configura el archivo `application.properties` para la conexión a la base de datos:**
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/Trackme
   spring.datasource.username=root
   spring.datasource.password=estudiante
   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   ```

6. **Compila y ejecuta el backend:**
   ```sh
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend

1. **Navega al directorio del frontend:**
   ```sh
   cd <DIRECTORIO_DEL_FRONTEND>
   ```

2. **Instala Angular CLI (si aún no lo tienes instalado):**
   ```sh
   npm install -g @angular/cli
   ```

3. **Instala las dependencias del proyecto:**
   ```sh
   npm install
   npm install leaflet
   npm install --save-dev @types/leaflet
   ```

4. **Ejecuta el servidor en modo desarrollo:**
   ```sh
   ng serve
   ```

 Esto compilará la aplicación y la abrirá en tu navegador por defecto (generalmente `http://localhost:4200`).


 5. **Despliegue en Produccion:**
- Contruir el proyecto con la configuracion de produccion
   ```sh
   ng build --configuration production
   ```
- Servir los archivos estáticos generados:
   ```sh
    http-server ./dist/SistemaDesaparecidos/browser/
   ```

## Uso

1.  **Registro:** Navega a `/registro` para crear una nueva cuenta de usuario.
2.  **Iniciar Sesión:** Navega a `/iniciar-sesion` con tus credenciales. Al iniciar sesión, se almacenará tu email en `localStorage` para mantener la sesión.
3.  **Ver Reportes y Avistamientos:** Accede a `/reportes` para ver los listados principales. Aquí encontrarás los reportes de personas desaparecidas y un foro/listado de avistamientos reportados.
4.  **Crear Reporte:** Si tienes permisos (estás logueado o el feature flag `create-reports` está activo), verás la opción para crear un nuevo reporte. Deberás ingresar detalles y seleccionar la ubicación en un mapa.
5.  **Crear Avistamiento:** Si tienes permisos (estás logueado o el feature flag `create-sightings` está activo), verás la opción para reportar un avistamiento. Deberás seleccionar a la persona desaparecida de una lista, indicar la fecha y seleccionar la ubicación en un mapa.
6.  **Perfil:** Si estás logueado, puedes acceder a `/perfil` para ver y actualizar tus datos.

## Contribuciones

Si deseas contribuir al proyecto, por favor sigue las mejores prácticas de desarrollo colaborativo, realiza cambios en ramas separadas y envía un pull request con tus modificaciones. Asegúrate de documentar tus cambios y probarlos a fondo.

## Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

---
Desarrollado por el equipo de TrackMe.
