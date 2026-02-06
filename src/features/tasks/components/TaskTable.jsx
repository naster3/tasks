import { useDeferredValue, useEffect, useState } from 'react';
import { List } from 'react-window';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import useTasks from '../hooks/useTasks';
import TaskForm from './TaskForm';
import '../styles/taskTable.css';

const TaskTable = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    doneCount,
    isLoading,
    error,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setQuery,
  } = useTasks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allowVirtual, setAllowVirtual] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)');
    const handleChange = () => setAllowVirtual(!media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    setPage(1);
    setQuery(deferredSearchTerm.trim());
  }, [deferredSearchTerm, setPage, setQuery]);

  const handleSaveTask = async (taskData) => {
    if (isEditMode && currentTask) {
      await updateTask(currentTask.id, taskData);
    } else {
      await addTask(taskData);
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

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
    } catch (error) {
      alert('No se pudo eliminar la tarea.');
    }
  };

  const handleAdd = () => {
    setCurrentTask(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const statusLabel = (status) => (status === 'hecho' ? 'Hecho' : 'En proceso');

  const shouldVirtualize = allowVirtual && tasks.length > 25;
  const rowHeight = 72;
  const listHeight = Math.min(tasks.length * rowHeight, 420);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const pageNumbers = (() => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, page - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    startPage = Math.max(1, endPage - maxButtons + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  })();

  const rowData = {
    items: tasks,
    onEdit: handleEdit,
    onDelete: handleDelete,
    statusLabel,
  };

  const TaskRow = ({ task, onEdit, onDelete, statusLabel, style }) => (
    <div className="table-row" style={style} role="row">
      <div className="table-cell cell-title" data-label="Titulo" role="cell">
        {task.title}
      </div>
      <div className="table-cell cell-desc" data-label="Descripcion" role="cell">
        {task.description}
      </div>
      <div className="table-cell cell-status" data-label="Estado" role="cell">
        <span
          className={`status-badge ${
            task.status === 'hecho' ? 'status-done' : 'status-progress'
          }`}
        >
          {statusLabel(task.status)}
        </span>
      </div>
      <div className="table-cell cell-actions" data-label="Acciones" role="cell">
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={() => onEdit(task)}>
            <FiEdit2 aria-hidden="true" />
            Modificar
          </button>
          <button className="btn btn-danger" onClick={() => onDelete(task.id)}>
            <FiTrash2 aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

  const VirtualRow = ({ index, style, items, onEdit, onDelete, statusLabel }) => {
    const task = items[index];
    return (
      <TaskRow
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        statusLabel={statusLabel}
        style={style}
      />
    );
  };

  return (
    <section className="page">
      <div className="card">
        <div className="card-header">
          <div className="title-group">
            <p className="eyebrow">Panel de trabajo</p>
            <h2>Lista de tareas</h2>
            <p className="subtitle">
              {isLoading
                ? 'Cargando tareas...'
                : `Mostrando ${startItem}-${endItem} de ${total} tareas - ${doneCount} completadas en esta pagina`}
            </p>
          </div>
          <div className="header-actions">
            <label className="search-field">
              <FiSearch aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar por titulo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                disabled={isFormOpen || isLoading}
              />
            </label>
            <button className="btn btn-primary" onClick={handleAdd} disabled={isLoading}>
              <FiPlus aria-hidden="true" />
              Agregar tarea
            </button>
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}

        <div className={`table-container ${isFormOpen ? 'disabled' : ''}`}>
          <div className="table-grid" role="table" aria-label="Lista de tareas">
            <div className="table-row table-head" role="row">
              <div className="table-cell cell-title" role="columnheader">
                Titulo
              </div>
              <div className="table-cell cell-desc" role="columnheader">
                Descripcion
              </div>
              <div className="table-cell cell-status" role="columnheader">
                Estado
              </div>
              <div className="table-cell cell-actions" role="columnheader">
                Acciones
              </div>
            </div>
            <div className="table-body">
              {isLoading ? (
                <div className="empty-state">Cargando tareas...</div>
              ) : error ? (
                <div className="empty-state">No se pudieron cargar las tareas.</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">No hay tareas que coincidan con la busqueda.</div>
              ) : shouldVirtualize ? (
                <List
                  rowCount={tasks.length}
                  rowHeight={rowHeight}
                  rowComponent={VirtualRow}
                  rowProps={rowData}
                  style={{ height: listHeight, width: '100%', overflow: 'auto' }}
                />
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    statusLabel={statusLabel}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        <div className="pagination">
          <div className="page-info">
            Pagina {page} de {totalPages}
          </div>
          <div className="page-actions">
            <button
              className="btn btn-ghost"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={isLoading || page <= 1}
            >
              Anterior
            </button>
            <div className="page-numbers">
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`page-button ${pageNumber === page ? 'active' : ''}`}
                  onClick={() => setPage(pageNumber)}
                  disabled={isLoading}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={isLoading || page >= totalPages}
            >
              Siguiente
            </button>
            <label className="page-size">
              <span>Por pagina</span>
              <select
                value={limit}
                onChange={(event) => {
                  setPage(1);
                  setLimit(Number(event.target.value));
                }}
                disabled={isLoading}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <TaskForm
          onSave={handleSaveTask}
          onClose={() => setIsFormOpen(false)}
          initialData={isEditMode ? currentTask : null}
          mode={isEditMode ? 'edit' : 'add'}
        />
      )}
    </section>
  );
};

export default TaskTable;
