import '../styles/user-guide.css'

// Este componente contiene la documentacion operativa del inventario.
// Se mantiene separado de la pagina para que la ayuda siga siendo un modulo
// reutilizable y facil de extender sin tocar el router.
export default function UserGuideContent() {
  return (
    <article className="user-guide">
      <p className="user-guide__eyebrow">Manual operativo</p>
      <h1>Guia de uso del inventario</h1>
      <p>
        Esta pantalla permite iniciar sesion, consultar productos, registrar movimientos,
        editar fichas y revisar la bitacora de cada prenda.
      </p>

      <section>
        <h2>1. Acceso y roles</h2>
        <ul>
          <li>`admin`: puede crear, editar, archivar, restaurar y registrar movimientos.</li>
          <li>`operador`: puede crear, editar y registrar movimientos.</li>
          <li>`solo_lectura`: puede consultar inventario, movimientos y auditoria.</li>
        </ul>
      </section>

      <section>
        <h2>2. Vista principal</h2>
        <ul>
          <li>La cabecera muestra unidades totales y productos con bajo stock.</li>
          <li>El buscador filtra por producto, SKU o color.</li>
          <li>Los filtros permiten acotar por categoria, ubicacion, estado y vista.</li>
          <li>La tabla central lista SKU, nombre, stock, precio, estado y acciones.</li>
        </ul>
      </section>

      <section>
        <h2>3. Crear o editar prendas</h2>
        <ul>
          <li>Usa `Agregar prenda` para abrir la ficha de producto.</li>
          <li>Los campos obligatorios son producto, SKU, categoria y ubicacion.</li>
          <li>En alta inicial se puede definir stock inicial.</li>
          <li>En edicion se actualiza la ficha sin alterar stock directamente.</li>
        </ul>
      </section>

      <section>
        <h2>4. Registrar movimientos</h2>
        <ul>
          <li>`Entrada`: incrementa stock.</li>
          <li>`Salida`: descuenta stock.</li>
          <li>`Ajuste`: aplica una variacion manual positiva o negativa.</li>
          <li>`Devolucion`: incrementa stock como retorno.</li>
        </ul>
        <p>El sistema evita guardar movimientos que dejen el stock en negativo.</p>
      </section>

      <section>
        <h2>5. Bitacora y auditoria</h2>
        <ul>
          <li>El boton `Bitacora` abre el historial del producto seleccionado.</li>
          <li>La seccion de movimientos muestra tipo, cantidad, nota, autor y fecha.</li>
          <li>La auditoria muestra eventos de creacion, edicion, archivado y restauracion.</li>
          <li>Los cambios de ficha incluyen comparacion entre valores anteriores y actuales.</li>
        </ul>
      </section>

      <section>
        <h2>6. Importar, exportar y acciones masivas</h2>
        <ul>
          <li>`Exportar CSV` descarga la vista filtrada actual.</li>
          <li>`Importar CSV` crea productos a partir de un archivo compatible.</li>
          <li>Las acciones masivas permiten actualizar categoria y ubicacion.</li>
          <li>La migracion de datos locales intenta importar inventario guardado en localStorage.</li>
        </ul>
      </section>

      <section>
        <h2>7. Recomendaciones</h2>
        <ul>
          <li>Usa SKUs unicos y consistentes para evitar duplicados.</li>
          <li>Revisa la bitacora despues de movimientos sensibles o ajustes manuales.</li>
          <li>Archiva productos fuera de uso en lugar de borrarlos.</li>
        </ul>
      </section>
    </article>
  )
}
