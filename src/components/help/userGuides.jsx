import React from 'react';
import './userguide.css'
const UserGuides = () => {
    return (
        <>
        <div className='user-guide'>
        <h1> 1. Interfaz General</h1>
<h2>La interfaz consta de los siguientes elementos:</h2>
<ol>
<span className=''>Botón Agregar:</span> <p>Para agregar una nueva tarea.</p>
<span className=''>Campo de Búsqueda:</span> <p>Permite filtrar tareas por título.</p>
<span className=''>Tabla de Tareas:</span><p> Muestra todas las tareas con 
    opciones para modificarlas o eliminarlas.</p>
<span>Formulario de Tarea:</span><p> Un formulario emergente para agregar o modificar tareas.</p>
</ol>

  
       
           
<h1>2. Campo de Búsqueda</h1>
<ol>
<h2>El campo de búsqueda se encuentra en la parte 
    superior de la tabla de tareas y tiene un icono de 
    lupa 🔍. Utilízalo para buscar tareas por su título:</h2>

<p>Escribe parte del título de la tarea que deseas encontrar.
A medida que escribes, la tabla mostrará solo las tareas que coincidan con el término de búsqueda.</p>
<span className='note'>Nota: El campo de búsqueda estará deshabilitado mientras el formulario de tarea esté abierto.</span>
</ol>
<h1>3. Tabla de Tareas</h1>
<ol>
<h2>La tabla muestra las tareas actuales en un formato de lista con 
    columnas para:</h2>

<span>Título:</span> <p>El nombre de la tarea.</p>
<span>Descripción:</span> <p>Una breve descripción de la tarea.</p>
<span>Estado:</span> <p>El estado de la tarea (hecho o en proceso).</p>
<span>Acciones:</span> <p>Botones para modificar o eliminar la tarea. Cada fila de la tabla corresponde a una tarea y cuenta con opciones para realizar las siguientes acciones:</p>

<span>Modificar:</span><p> Abre el formulario con los datos de la tarea para que puedas hacer cambios.</p>
<span>Eliminar:</span> <p> Borra la tarea de la lista.</p>
</ol>
<h1>4. Botón Agregar Tarea</h1>
<ol>
<span>Para agregar una nueva tarea:</span>

<p>Haz clic en el botón Agregar.Se abrirá el formulario de tareas en modo "Agregar".</p>
</ol>
<h1>5. Formulario de Tarea</h1>
<ol>
<h2>5.1 Modos del Formulario</h2>
<p>El formulario de tarea puede abrirse en dos modos:</p>

<span>Agregar:</span><p> Para crear una nueva tarea.</p>
<span>Modificar:</span> <p>Para editar una tarea existente.</p>
<h2>5.2 Campos del Formulario</h2>
<p>El formulario contiene los siguientes campos:</p>

<span>Título:</span> <p>Nombre de la tarea.</p>
<span>Descripción:</span> <p>Descripción breve de la tarea.</p>
<span>Estado:</span> <p>Un menú desplegable para elegir si la tarea está "hecho" o "en proceso".</p>
<h2>5.3 Botones del Formulario</h2>
<p>El formulario incluye los siguientes botones:</p>

<span>Guardar:</span> <p>Guarda la nueva tarea o los cambios realizados a una tarea existente.</p>
<span>Limpiar:</span> <p>Borra el contenido de los campos para introducir nueva información.</p>
<span>Cancelar:</span> <p>Cierra el formulario sin guardar los cambios.</p>
<span>Cerrar (✖):</span> <p>Cierra el formulario sin realizar cambios.</p>
<h2>5.4 Pasos para Agregar una Tarea</h2>
<p>Haz clic en el botón Agregar.</p>
<p>En el formulario, completa los campos de Título, Descripción y Estado.</p>
<p>Haz clic en Guardar para agregar la tarea.</p>
<p>La nueva tarea aparecerá en la tabla.</p>
<h2>5.5 Pasos para Modificar una Tarea</h2>
<p>Haz clic en el botón Modificar junto a la tarea que deseas editar.</p>
<p>El formulario se abrirá, mostrando los datos de la tarea seleccionada.</p>
<p>Realiza los cambios necesarios en los campos.</p>
<p>Haz clic en Actualizar para guardar los cambios.</p>
<p>La tabla mostrará los datos actualizados de la tarea.</p>
</ol>
<h1>6. Eliminar una Tarea</h1>
<p>Para eliminar una tarea de la lista:</p>

<p>Haz clic en el botón Eliminar junto a la tarea que deseas borrar.</p>
<p>La tarea se eliminará de la tabla inmediatamente.</p>
<h1>7. Notas Adicionales</h1>
<p>La tabla se deshabilita mientras el formulario de tarea está abierto. Esto evita que se puedan modificar otras tareas mientras se agrega o modifica una tarea existente.</p>
<p>Si dejas algún campo vacío al intentar guardar o actualizar una tarea, la aplicación mostrará una alerta solicitando que completes todos los campos.</p>
<p>Puedes cerrar el formulario en cualquier momento haciendo clic en Cancelar o en el botón de cerrar (✖) sin guardar cambios.</p>
</div>
        </>
    );
}

export default UserGuides;
