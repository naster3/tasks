import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/taskForm.css';

const TaskForm = ({ onSave, onClose, initialData = null, mode = 'add' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('en proceso');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setStatus(initialData.status);
    }
  }, [initialData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    if (title && description && status) {
      setIsSaving(true);
      try {
        await onSave({ title, description, status });
        handleClear();
        onClose();
      } catch (error) {
        alert('No se pudo guardar la tarea.');
      } finally {
        setIsSaving(false);
      }
    } else {
      alert('Por favor, complete todos los campos.');
    }
  };

  const handleClear = () => {
    setTitle('');
    setDescription('');
    setStatus('en proceso');
  };

  return (
    <div className="form-overlay">
      <div className="form-container" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <button className="icon-btn close-btn" onClick={onClose} aria-label="Cerrar formulario">
          <FiX aria-hidden="true" />
        </button>
        <h2 id="form-title">{mode === 'edit' ? 'Modificar tarea' : 'Agregar tarea'}</h2>
        <label className="field">
          <span>Titulo</span>
          <input
            type="text"
            placeholder="Ej. Actualizar landing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />
        </label>
        <label className="field">
          <span>Descripcion</span>
          <input
            type="text"
            placeholder="Detalle breve de la tarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </label>
        <label className="field">
          <span>Estado</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isSaving}
          >
            <option value="hecho">Hecho</option>
            <option value="en proceso">En proceso</option>
          </select>
        </label>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Guardar'}
          </button>
          <button className="btn btn-warning" onClick={handleClear} disabled={isSaving}>
            Limpiar
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
