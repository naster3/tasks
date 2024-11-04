// TaskTable.js
import React, { useState } from 'react';
import Form from './form';
import './table.css';

const TaskTable = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Tarea 1', description: 'Descripción de tarea 1', status: 'hecho' },
    { id: 2, title: 'Tarea 2', description: 'Descripción de tarea 2', status: 'en proceso' },
    { id: 3, title: 'Tarea 3', description: 'Descripción de tarea 3', status: 'hecho' },
    { id: 4, title: 'Tarea 4', description: 'Descripción de tarea 4', status: 'hecho' },
    { id: 5, title: 'Tarea 5', description: 'Descripción de tarea 5', status: 'en proceso' },
    { id: 6, title: 'Tarea 6', description: 'Descripción de tarea 6', status: 'hecho' },
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveTask = (taskData) => {
    if (isEditMode) {
      setTasks(tasks.map(task => 
        task.id === currentTask.id ? { ...task, ...taskData } : task
      ));
    } else {
      setTasks([...tasks, { id: tasks.length + 1, ...taskData }]);
    }
    setIsFormOpen(false);
    setIsEditMode(false);
    setCurrentTask(null);
  };

  const handleEdit = (task) => {
    setCurrentTask(task);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleAdd = () => {
    setCurrentTask(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  return (
    <div className="container">
      <h2>Lista de Tareas</h2>

      {/* Botón Agregar */}
      <button className="add-button" onClick={handleAdd}>Agregar</button>

      {/* Campo de búsqueda */}
      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Buscar por título" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          disabled={isFormOpen} // Deshabilitar la búsqueda si el formulario está abierto
        />
      </div>

      {/* Tabla (bloqueada si el formulario está abierto) */}
      <div className={`table-container ${isFormOpen ? 'disabled' : ''}`}>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.description}</td>
                <td>{task.status}</td>
                <td>
                  <button onClick={() => handleEdit(task)}>Modificar</button>
                  <button onClick={() => handleDelete(task.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario de Agregar/Modificar Tarea */}
      {isFormOpen && (
        <Form 
          onSave={handleSaveTask} 
          onClose={() => setIsFormOpen(false)} 
          initialData={isEditMode ? currentTask : null} 
          mode={isEditMode ? "edit" : "add"}
        />
      )}
    </div>
  );
};

export default TaskTable;

