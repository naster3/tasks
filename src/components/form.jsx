// Form.js
import React, { useState, useEffect } from 'react';
import './form.css';

const Form = ({ onSave, onClose, initialData = null, mode = "add" }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('en proceso');

  // Cargar los datos iniciales si se proporcionan (modo modificar)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setStatus(initialData.status);
    }
  }, [initialData]);

  const handleSave = () => {
    if (title && description && status) {
      onSave({ title, description, status });
      handleClear();
      onClose();
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  const handleClear = () => {
    setTitle('');
    setDescription('');
    setStatus('en proceso');
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>{mode === "edit" ? "Modificar Tarea" : "Agregar Tarea"}</h2>
        <input 
          type="text" 
          placeholder="Título" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Descripción" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="hecho">Hecho</option>
          <option value="en proceso">En Proceso</option>
        </select>
        <div className="form-buttons">
          <button onClick={handleSave}>{mode === "edit" ? "Actualizar" : "Guardar"}</button>
          <button onClick={handleClear}>Limpiar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default Form;
