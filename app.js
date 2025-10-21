const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const ventasService = require('./services/ventas');

// integracion de chalk
let chalk;
try {
    chalk = require('chalk');
} catch (e) {
}

const color = (style, text) => {
    if (!chalk) {
        return text;
    }
    if (style.includes('.')) {
        try {
            return style.split('.').reduce((acc, method) => acc[method], chalk)(text);
        } catch {
            return text;
        }
    }
    if (chalk[style]) {
        return chalk[style](text);
    }
    return text;
};

//  Par Alineación de Columnas
const MAX_NAME_WIDTH = 15; 
const PRICE_WIDTH = 10;
const DESC_WIDTH_TICKET = 30; 
const VALUE_WIDTH_TICKET = 10;


/**
 * Muestra la lista de productos disponibles.
 * @param {boolean} volverAlMenu - Indica si debe regresar al menú principal.
 */
function listarProductos(volverAlMenu = true) {
    const productos = ventasService.obtenerProductosDisponibles();
    console.log(color('magenta', "\n LISTA DE PRODUCTOS DISPONIBLES:"));
    productos.forEach(p => {
        console.log(`ID: ${p.id} - ${p.nombre.padEnd(MAX_NAME_WIDTH, ' ')} (${color('blue', `S/${p.precio.toFixed(2)}`.padStart(PRICE_WIDTH, ' '))})`);
    });
    
    if (volverAlMenu) {
        menu();
    }
}

// ===========Agregar el producto=============

function agregarProductoFlujo(productoElegido) {
    readline.question(`Ingrese la cantidad de ${productoElegido.nombre}: `, cantidadStr => {
        const cantidad = Number(cantidadStr.trim());

        if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
            console.log(color('red', `❌ Error: La cantidad debe ser un número entero mayor a 0.`));
            pedirProducto();
            return;
        }

        const mensaje = ventasService.agregarItemAlCarrito(productoElegido, cantidad);
        console.log(color('green', mensaje)); 
        
        pedirProducto(); 
    });
}

//========== Pedir producto =============

function pedirProducto() {
    readline.question("🛒 Producto (Nombre/ID) o 'salir' para finalizar la venta: ", respuesta => {
        const valor = respuesta.trim();

        if (valor.toLowerCase() === 'salir') {
            menu(); 
            return;
        }
        
        const productoElegido = ventasService.buscarProductoDisponible(valor);

        if (productoElegido) {
            agregarProductoFlujo(productoElegido); 
        } else {
            console.log(color('red', `❌ Producto "${valor}" no encontrado en el inventario.`)); 
            pedirProducto();
        }
    });
}

//============ buscar producto ==================

function buscarProductoUI() {
    readline.question(color('yellow', " Ingrese el ID o Nombre del producto a buscar: "), valor => {
        const valorBusqueda = valor.trim();
        const producto = ventasService.buscarProductoDisponible(valorBusqueda);

        if (producto) {
            console.log(color('green', "\n Producto Encontrado:"));
            console.log(color('cyan', "-----------------------------------"));
            console.log(`ID: ${producto.id}`);
            console.log(`Nombre: ${producto.nombre}`);
            console.log(`Precio Unitario: ${color('blue', `S/${producto.precio.toFixed(2)}`)}`);
            console.log(color('cyan', "-----------------------------------"));
        } else {
            console.log(color('red', ` Producto "${valorBusqueda}" no encontrado en el catálogo.`));
        }
        menu();
    });
}

// ========== Eliminar producto  del carrito ===============

function eliminarItemDelCarritoUI(callback = menu) {
    const carrito = ventasService.obtenerCarrito();
    if (carrito.length === 0) {
        console.log(color('yellow', "El carrito está vacío. No hay nada que eliminar."));
        callback();
        return;
    }
    
    // Se omite la muestra del carrito aquí ya que esta función 
    
    readline.question("Ingrese el ID o Nombre del producto a ELIMINAR: ", valor => {
        const resultado = ventasService.eliminarItemDelCarrito(valor);

        if (resultado.success) {
            console.log(color('green', resultado.message)); 
        } else {
            console.log(color('red', resultado.message)); 
        }
        callback();
    });
}

/**
 * Flujo para vaciar el carrito con confirmación.
 * Acepta un callback para decidir a dónde volver.
 */
function vaciarCarritoUI(callback = menu) {
    readline.question(color('red', "¿Estás seguro de VACÍAR todo el carrito? (s/n): "), respuesta => {
        if (respuesta.toLowerCase() === 's') {
            ventasService.vaciarCarrito();
            console.log(color('green', "El carrito ha sido vaciado completamente.")); 
        } else {
            console.log("Acción de vaciado cancelada.");
        }
        callback();
    });
}

//============ Carrito ==================
function verCarritoMenu() {
    const carrito = ventasService.obtenerCarrito();
    
    console.log(color('bold.cyan', "\n---  Carrito Actual ---"));
    if (carrito.length === 0) {
        console.log("El carrito está vacío.");
        menu();
        return;
    } 

    // ver producto del carrito con nombre cantidad y subtotal.
    console.log(`- ${"Producto".padEnd(MAX_NAME_WIDTH, ' ')} ( Cant ) | Unitario | Subtotal`);
    console.log(color('cyan', '-'.repeat(MAX_NAME_WIDTH + 34)));

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        const nombreDisplay = item.nombre.padEnd(MAX_NAME_WIDTH, ' ');
        const cantidadDisplay = item.cantidad.toString().padStart(4, ' ');
        const precioUnitario = `S/${item.precio.toFixed(2)}`.padStart(PRICE_WIDTH, ' ');
        const subtotalItem = `S/${subtotal.toFixed(2)}`.padStart(PRICE_WIDTH, ' ');

        console.log(
            `- ${nombreDisplay} (${cantidadDisplay}) | ${color('blue', precioUnitario)} | ${color('yellow', subtotalItem)}`
        );
    });

    const { totalGeneral } = ventasService.calcularTotal(); 
    console.log(color('cyan', "-----------------------------------"));
    console.log(color('bold.yellow', `Total General Estimado (Incl. IGV): S/${totalGeneral.toFixed(2)}`));
    console.log(color('cyan', "-----------------------------------"));


    // Sub-menu para gestión del Carrito
    console.log(color('bold.yellow', "\nOpciones del Carrito:"));
    console.log("A. Eliminar un ítem");
    console.log("B. Vaciar carrito completo");
    console.log("C. Volver al Menú Principal");

    readline.question(color('yellow', "\nElige una opción: "), function(opcion) {
        switch(opcion.toUpperCase()) {
            case "A":
                // eliminar y vuelve a verCarritoMenu
                eliminarItemDelCarritoUI(verCarritoMenu); 
                break;
            case "B":
                //  vaciar y vuelve a verCarritoMenu
                vaciarCarritoUI(verCarritoMenu); 
                break;
            case "C":
                menu();
                break;
            default:
                console.log(color('red', "Opción no válida. Inténtalo de nuevo."));
                verCarritoMenu();
        }
    });
}

// muestra el contenido de las ventas

function mostrarCalculosSimples() {
    const carrito = ventasService.obtenerCarrito();
    if (carrito.length === 0) {
        console.log(color('yellow', "El carrito está vacío. No hay cálculos que mostrar."));
        menu();
        return;
    }
    
    const { subtotal, descuento, igv, totalGeneral, baseImponible } = ventasService.calcularTotal();
    
    console.log(color('bold.blue', "\n---  Detalle de Cálculos ---"));
    console.log(color('cyan', "-------------------------------------------"));
    
    const alignTotalLine = (label, value, isBold = false) => {
        const valueDisplay = `S/${value.toFixed(2)}`.padStart(VALUE_WIDTH_TICKET, ' ');
        const labelPadded = label.padEnd(DESC_WIDTH_TICKET + 3, ' ');
        const style = isBold ? 'bold.yellow' : 'yellow';
        
        console.log(color('cyan', `${labelPadded} ${color(style, valueDisplay)}`));
    };

    alignTotalLine(`Subtotal (Suma Items):`, subtotal);
    alignTotalLine(`Descuento aplicado:`, descuento);
    
    console.log(color('cyan', "-------------------------------------------"));

    alignTotalLine(`Base Imponible (antes de IGV):`, baseImponible);
    alignTotalLine(`IGV (18%):`, igv);

    console.log(color('cyan', "==========================================="));

    const totalLabel = `TOTAL ESTIMADO:`;
    const totalLabelPadded = totalLabel.padEnd(DESC_WIDTH_TICKET + 3, ' ');
    const totalValueDisplay = `S/${totalGeneral.toFixed(2)}`.padStart(VALUE_WIDTH_TICKET, ' ');

    console.log(color('bold.green', `${totalLabelPadded} ${color('bold.yellow', totalValueDisplay)}`));
    
    menu();
}



// Ticket con los detalles
function mostrarResumen() {
    const carrito = ventasService.obtenerCarrito();
    if (carrito.length === 0) {
        console.log(color('yellow', " No hay productos en el carrito para generar el ticket."));
        menu();
        return;
    }
    
    const { subtotal, descuento, igv, totalGeneral } = ventasService.calcularTotal();
    
    console.log(color('bold.blue', "\n TICKET DE COMPRA:"));
    console.log(color('cyan', "-------------------------------------------"));
    
    // Items del Ticket
    carrito.forEach((item, i) => {
        const subtotalItem = item.precio * item.cantidad;
        const itemNumber = (i + 1).toString().padStart(2, ' ');
        const itemDescription = `${item.nombre} (x${item.cantidad.toString().padStart(2, ' ')})`.padEnd(DESC_WIDTH_TICKET, ' ');
        const itemValue = `S/${subtotalItem.toFixed(2)}`.padStart(VALUE_WIDTH_TICKET, ' ');
        
        console.log(`${itemNumber}. ${itemDescription} ${color('blue', itemValue)}`);
    });

    // Totales Alineados 
    const alignTotalLine = (label, value, isBold = false) => {
        const valueDisplay = `S/${value.toFixed(2)}`.padStart(VALUE_WIDTH_TICKET, ' ');
        const labelPadded = label.padEnd(DESC_WIDTH_TICKET + 3, ' ');
        const style = isBold ? 'bold.yellow' : 'yellow';
        console.log(color('cyan', `${labelPadded} ${color(style, valueDisplay)}`));
    };

    console.log(color('cyan', "==========================================="));
    alignTotalLine(`Subtotal (Suma Items):`, subtotal);
    alignTotalLine(`Descuento aplicado:`, descuento);
    console.log(color('cyan', "-------------------------------------------"));
    alignTotalLine(`IGV (18%):`, igv);

    console.log(color('cyan', "==========================================="));

    const totalLabel = `TOTAL A PAGAR:`;
    const totalLabelPadded = totalLabel.padEnd(DESC_WIDTH_TICKET + 3, ' ');
    const totalValueDisplay = `S/${totalGeneral.toFixed(2)}`.padStart(VALUE_WIDTH_TICKET, ' ');

    console.log(color('bold.green', `${totalLabelPadded} ${color('bold.yellow', totalValueDisplay)}`));
    
    console.log(color('green', "\n🎉 ¡Gracias por su compra! Carrito vaciado."));
    
    ventasService.vaciarCarrito();
    menu();
}


// ========== reportes  =================
function mostrarTopCaros() {
    const topCaros = ventasService.obtenerTopProductosMasCaros();
    console.log(color('bold.magenta', "\n TOP 3 PRODUCTOS MÁS CAROS (Catálogo):"));
    if (topCaros.length === 0) {
        console.log("Catálogo vacío.");
        menuReportes();
        return;
    }
    const NAME_WIDTH_REPORT = 20;
    topCaros.forEach((p, index) => {
        const rank = (index + 1).toString().padStart(2, ' ');
        const name = p.nombre.padEnd(NAME_WIDTH_REPORT, ' ');
        const price = `S/${p.precio.toFixed(2)}`.padStart(PRICE_WIDTH, ' ');
        console.log(`${rank}. ${name} - Precio: ${color('blue', price)}`);
    });
    menuReportes();
}

function mostrarMasVendidos() {
    const masVendidos = ventasService.obtenerProductosMasVendidos();
    console.log(color('bold.magenta', "\n PRODUCTOS MÁS VENDIDOS (Sesión Actual):"));
    if (masVendidos.length === 0) {
        console.log("No se han registrado ventas en esta sesión.");
        menuReportes();
        return;
    }
    const NAME_WIDTH_REPORT = 20;
    const QTY_WIDTH = 5;
    masVendidos.forEach((item, index) => {
        const rank = (index + 1).toString().padStart(2, ' ');
        const name = item.nombre.padEnd(NAME_WIDTH_REPORT, ' ');
        const quantity = item.cantidad.toString().padStart(QTY_WIDTH, ' ');
        console.log(`${rank}. ${name} - Cantidad Vendida: ${color('green', quantity)} unidades`);
    });
    menuReportes();
}

function mostrarResumenCarritoUI() {
    const { totalItems, montoAcumulado } = ventasService.obtenerResumenCarrito();
    console.log(color('bold.magenta', "\n RESUMEN DEL CARRITO:"));
    if (totalItems === 0) {
        console.log("El carrito está vacío.");
    } else {
        console.log(color('cyan', "-------------------------------------------"));
        console.log(`- Cantidad Total de Ítems (Unidades): ${color('bold.yellow', totalItems.toString())}`);
        console.log(`- Monto Acumulado (antes de descuentos/IGV): ${color('bold.yellow', `S/${montoAcumulado.toFixed(2)}`)}`);
        console.log(color('cyan', "-------------------------------------------"));
    }
    menuReportes();
}

//============= SUBMENÚ DE REPORTES =================
function menuReportes() {
    console.log(color('bold.yellow', "\n--- SUBMENÚ DE REPORTES ---")); 
    console.log("1. Top 3 Productos más Caros (Catálogo)");
    console.log("2. Productos más Vendidos (Sesión)");
    console.log("3. Resumen del Carrito Actual");
    console.log("4. Volver al Menú Principal");

    readline.question(color('yellow', "\nElige una opción de reporte: "), function(opcion) {
        switch(opcion) {
            case "1":
                mostrarTopCaros();
                break;
            case "2":
                mostrarMasVendidos();
                break;
            case "3":
                mostrarResumenCarritoUI();
                break;
            case "4":
                menu();
                break;
            default:
                console.log(color('red', "Opción no válida. Inténtalo de nuevo."));
                menuReportes();
        }
    });
}

//============= MENÚ PRINCIPAL =================
function menu() {
    console.log(color('bold.cyan', "\n--- SISTEMA ERP MINI-DELICIA ---")); 
    console.log("1. Registrar venta");
    console.log("2. Listar productos");
    console.log("3. Buscar producto");
    console.log("4. Ver carrito");
    console.log("5. Calcular total");
    console.log("6. Generar ticket y finalizar venta");
    console.log(color('yellow', "7. Reportes y Estadisticas"));
    console.log("8. Salir");

    readline.question(color('cyan', "\nElige una opción: "), function(opcion) {
        switch(opcion) {
            case "1":
                listarProductos(false); 
                pedirProducto();
                break;
            case "2":
                listarProductos();
                break;
            case "3": // Buscar producto
                buscarProductoUI(); 
                break;
            case "4": // Ver carrito 
                break;
            case "5": // Calcular total
                mostrarCalculosSimples();
                break;
            case "6": // Generar ticket
                mostrarResumen();
                break;
            case "7":
                menuReportes();
                break;
            case "8":
                console.log(color('yellow', "Saliendo del sistema..."));
                readline.close();
                return;
            default:
                console.log(color('red', "Opción no válida. Inténtalo de nuevo."));
                menu();
        }
    });
}

// Iniciar el menú
menu();
