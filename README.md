# 🔐 LibreAuth

Una aplicación de autenticación 2FA **libre**, segura y 100% offline, gratuita y de código abierto. Desarrollada con React Native y Expo.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-Active-green.svg)

## ✨ Características

* **🔒 Privacidad Primero:** 100% Offline. Tus claves nunca salen de tu dispositivo.
* **📂 Organización:** Agrupa tus cuentas en carpetas (Trabajo, Juegos, Finanzas...).
* **🎨 Personalizable:** Iconos vectoriales, colores personalizados y Modo Oscuro/Claro automático.
* **⚡ Rápida:** Interfaz fluida con animaciones.
* **📸 Escáner QR:** Añade cuentas rápidamente escaneando códigos QR estándar.
* **⌨️ Entrada Manual:** Soporte completo para añadir claves manualmente.
* **🛡️ Segura:** Almacenamiento encriptado utilizando `SecureStore` del dispositivo.

## 📱 Capturas de Pantalla

|    Pantalla Principal    |       Modo Oscuro        |      Añadir Cuenta       |         Carpetas         |
| :----------------------: | :----------------------: | :----------------------: | :----------------------: |
| Proximamente... | Proximamente... | Proximamente... | Proximamente... |

## 🛠️ Tecnologías

Este proyecto está construido con las mejores herramientas del ecosistema React Native:

* **[Expo](https://expo.dev/)** - SDK y Build tools.
* **[Expo Router](https://docs.expo.dev/router/introduction/)** - Navegación basada en ficheros.
* **[Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)** - Almacenamiento encriptado local.
* **[Lucide React Native](https://lucide.dev/)** - Iconografía moderna.
* **[TypeScript](https://www.typescriptlang.org/)** - Para un código robusto y seguro.

## 🚀 Cómo ejecutarlo localmente

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Danii47/LibreAuth.git](https://github.com/Danii47/LibreAuth.git)
    cd LibreAuth
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npx expo start
    ```

4.  **Ejecutar:**
    * Escanea el QR con la app **Expo Go** (Android/iOS).
    * O presiona `a` para abrir en emulador Android.
    * O presiona `i` para abrir en simulador iOS.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la app:

1.  Haz un Fork del proyecto.
2.  Crea una rama con tu nueva funcionalidad (`git checkout -b feature/AmazingFeature`).
3.  Haz Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
4.  Haz Push a la rama (`git push origin feature/AmazingFeature`).
5.  Abre un Pull Request.

## ⚠️ Nota sobre Seguridad y Backups

Al ser una aplicación **100% offline**, no existe una "nube" donde se guarden tus contraseñas.
* Si borras la aplicación o pierdes el dispositivo, **perderás tus códigos**.
* Se recomienda mantener una copia de seguridad de las claves secretas ("seeds") o configurar métodos de recuperación alternativos en tus servicios.

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---
Hecho con ❤️ por Dani47