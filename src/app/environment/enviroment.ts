const production = true; // Cambia esto a true para usar la URL de producción

export const environment = {
    production: production,
    apiUrl: production
        //? 'https://backendcmaa.onrender.com/api' // URL de producción -> antiguo Backend
        ? 'https://backendchess-v2.onrender.com/api' // URL de producción
        : 'http://localhost:3000/api'   // URL de desarrollo
};