/** Catálogo de productos.
 * @type {Array<Object>}
 */
const productosDisponibles = [
    { id: 1, nombre: "pan", precio: 2.00 },
    { id: 2, nombre: "leche", precio: 3.50 },
    { id: 3, nombre: "queso", precio: 7.00 },
    { id: 4, nombre: "galletas", precio: 4.00 },
  
];

/** Busca un producto en el catálogo por id o el nombre.
  @param {string | number} valor 
 @returns {object | null} 
 */
function buscarProductoDisponible(valor) {
    const id = Number(valor);
    if (!isNaN(id) && id > 0) {
        return productosDisponibles.find(p => p.id === id);
    }
    if (typeof valor === "string") {
        return productosDisponibles.find(p => p.nombre.toLowerCase() === valor.toLowerCase());
    }
    return null;
}

module.exports = {
    productosDisponibles,
    buscarProductoDisponible
};
