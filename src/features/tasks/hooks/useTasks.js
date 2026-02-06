import { useCallback, useEffect, useMemo, useState } from 'react';

const isTauri =
  typeof window !== 'undefined' &&
  (window.__TAURI__ || window.__TAURI_IPC__);

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (isTauri ? 'http://127.0.0.1:5000/api' : '/api');

const request = async (path, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Error en la solicitud');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchTasks = useCallback(
    async (signal) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (query) {
          params.set('query', query);
        }
        const data = await request(`/tasks?${params.toString()}`, { signal });
        setTasks(data.items || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
        if (data.page && data.page !== page) {
          setPage(data.page);
        }
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('No se pudieron cargar las tareas.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [limit, page, query]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [fetchTasks, refreshIndex]);

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const addTask = useCallback(async (taskData) => {
    await request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    setPage(1);
    setQuery('');
    refresh();
  }, [refresh]);

  const updateTask = useCallback(async (id, updates) => {
    await request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    refresh();
  }, [refresh]);

  const deleteTask = useCallback(async (id) => {
    await request(`/tasks/${id}`, { method: 'DELETE' });
    refresh();
  }, [refresh]);

  const doneCount = useMemo(
    () => tasks.filter((task) => task.status === 'hecho').length,
    [tasks]
  );

  return {
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
    query,
    setQuery,
    refresh,
  };
};

export default useTasks;
