import './Guide.css';

const Guide = () => {
  return (
    <div className="user-guide">
      <header className="guide-hero">
        <p className="eyebrow">Guia de usuario</p>
        <h1>Como usar el tablero de tareas</h1>
        <p className="guide-intro">
          Este panel te ayuda a crear, buscar y organizar tareas. Todo se actualiza al instante.
        </p>
      </header>

      <section>
        <h2>1. Interfaz general</h2>
        <ul>
          <li>
            <strong>Boton Agregar:</strong> abre el formulario para crear una tarea nueva.
          </li>
          <li>
            <strong>Campo de busqueda:</strong> filtra tareas por titulo.
          </li>
          <li>
            <strong>Tabla de tareas:</strong> muestra tareas, estado y acciones.
          </li>
          <li>
            <strong>Formulario:</strong> aparece como modal para agregar o modificar.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Campo de busqueda</h2>
        <p>
          Escribe parte del titulo para filtrar la lista. Si el formulario esta abierto, la
          busqueda se desactiva para evitar cambios accidentales.
        </p>
      </section>

      <section>
        <h2>3. Tabla de tareas</h2>
        <ul>
          <li>
            <strong>Titulo:</strong> nombre corto de la tarea.
          </li>
          <li>
            <strong>Descripcion:</strong> detalle breve de lo que hay que hacer.
          </li>
          <li>
            <strong>Estado:</strong> indica si esta hecho o en proceso.
          </li>
          <li>
            <strong>Acciones:</strong> botones para modificar o eliminar.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Agregar una tarea</h2>
        <ol>
          <li>Haz clic en el boton Agregar.</li>
          <li>Completa titulo, descripcion y estado.</li>
          <li>Haz clic en Guardar.</li>
        </ol>
      </section>

      <section>
        <h2>5. Modificar una tarea</h2>
        <ol>
          <li>Haz clic en Modificar junto a la tarea.</li>
          <li>Actualiza los campos necesarios.</li>
          <li>Haz clic en Actualizar.</li>
        </ol>
      </section>

      <section>
        <h2>6. Eliminar una tarea</h2>
        <p>Haz clic en Eliminar para borrar una tarea de la lista.</p>
      </section>

      <section className="note">
        <h2>Notas</h2>
        <ul>
          <li>La tabla se bloquea mientras el formulario esta abierto.</li>
          <li>Si dejas un campo vacio, veras una alerta.</li>
          <li>Puedes cerrar el formulario con Cancelar o con la X.</li>
        </ul>
      </section>
    </div>
  );
};

export default Guide;
