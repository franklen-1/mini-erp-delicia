const { productosDisponibles, buscarProductoDisponible } = require('../data/productos');

/**
 @type {Array<{id: number, nombre: string, precio: number, cantidad: number}>}
 */
let carrito = [];

/**
 * Calcula el total de la venta 
 @returns {{subtotal: number, descuento: number, igv: number, totalGeneral: number, baseImponible: number}}
 */
function calcularTotal() {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    let tasaDescuento = 0;

    // Reglas de descuento:
    if (subtotal >= 100) {
        tasaDescuento = 0.15; 
    } else if (subtotal >= 50) {
        tasaDescuento = 0.10; 
    } else if (subtotal >= 20) {
        tasaDescuento = 0.05; 
    }

    const descuento = subtotal * tasaDescuento;
    const montoDescontado = subtotal - descuento;
    
    const tasaIGV = 0.18;
    const igv = montoDescontado * tasaIGV;
    
    const totalGeneral = montoDescontado + igv;

    return { 
        subtotal: subtotal, 
        descuento: descuento, 
        igv: igv, 
        totalGeneral: totalGeneral,
        baseImponible: montoDescontado
    };
}

/** Agrega un producto al carrito o actualiza su cantidad si ya existe.
  @param {object} productoElegido 
  @param {number} cantidad 
  @returns {string} 
 */
function agregarItemAlCarrito(productoElegido, cantidad) {
    const itemExistente = carrito.find(item => item.id === productoElegido.id);

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
        return `✔️ ${productoElegido.nombre}: Cantidad actualizada a ${itemExistente.cantidad}.`;
    } else {
        carrito.push({
            id: productoElegido.id,
            nombre: productoElegido.nombre,
            precio: productoElegido.precio,
            cantidad: cantidad
        });
        return `✔️ ${productoElegido.nombre} agregado al carrito (x${cantidad}).`;
    }
}

/**
 * Elimina un producto completamente del carrito.
 @param {string | number} valor 
 @returns {{success: boolean, message: string}} 
 */
function eliminarItemDelCarrito(valor) {
    if (carrito.length === 0) {
        return { success: false, message: "El carrito está vacío. No hay nada que eliminar." };
    }
    
    const valorNormalizado = String(valor).toLowerCase();
    const indice = carrito.findIndex(item => 
        item.id === Number(valor) || item.nombre.toLowerCase() === valorNormalizado
    );

    if (indice !== -1) {
        const nombreEliminado = carrito[indice].nombre;
        carrito.splice(indice, 1);
        return { success: true, message: `🗑️ Producto "${nombreEliminado}" eliminado COMPLETAMENTE del carrito.` };
    } else {
        return { success: false, message: `❌ Producto "${valor}" no encontrado en el carrito.` };
    }
}


function vaciarCarrito() {
    carrito = [];
}

/**
 @returns {object[]} 
 */
function obtenerCarrito() {
    return carrito;
}

//========= Reportes =================


/** 
  @returns {Array<Object>} Lista de los 3 productos mas caros.
 */
function obtenerTopProductosMasCaros() {
    const productosOrdenados = [...productosDisponibles];
    productosOrdenados.sort((a, b) => b.precio - a.precio);
    return productosOrdenados.slice(0, 3);
}

/** Obtiene los productos más vendidos en la sesión
 @returns {Array<Object>} 
 */
function obtenerProductosMasVendidos() {
    const productosVendidos = [...carrito];
    productosVendidos.sort((a, b) => b.cantidad - b.cantidad);
    return productosVendidos;
}

/**  Obtiene un resumen simple del estado actual del carrito.
  @returns {{totalItems: number, montoAcumulado: number}}
 */

function obtenerResumenCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const montoAcumulado = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    return { totalItems, montoAcumulado };
}


module.exports = {
    obtenerCarrito,
    obtenerProductosDisponibles: () => productosDisponibles, 
    buscarProductoDisponible,
    agregarItemAlCarrito,
    eliminarItemDelCarrito,
    vaciarCarrito,
    calcularTotal,
    
    obtenerTopProductosMasCaros,
    obtenerProductosMasVendidos,
    obtenerResumenCarrito
};
