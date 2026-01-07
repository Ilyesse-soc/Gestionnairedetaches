import { useEffect, useState } from 'react';

interface Todo {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  byPriority: Record<string, number>;
}

type FilterType = 'all' | 'active' | 'completed';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [newTodo, setNewTodo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newCategory, setNewCategory] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'dueDate'>('createdAt');
  const [darkMode, setDarkMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ['Travail', 'Personnel', 'Urgent', 'Shopping', 'Santé', 'Autre'];
  
  const fetchTodos = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sortBy', sortBy);
      
      const response = await fetch(`/api/todos?${params}`);
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des tâches');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/todos/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [filter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    setLoading(true);
    try {
      const body: any = { title: newTodo };
      if (newDescription) body.description = newDescription;
      if (newPriority) body.priority = newPriority;
      if (newCategory) body.category = newCategory;
      if (newDueDate) body.dueDate = newDueDate;
      
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error('Failed to create todo');
      
      await fetchTodos();
      await fetchStats();
      setNewTodo('');
      setNewDescription('');
      setNewPriority('MEDIUM');
      setNewCategory('');
      setNewDueDate('');
      setShowAddForm(false);
      setError('');
    } catch (err) {
      setError('Erreur lors de l\'ajout de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: string, done: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !done })
      });
      if (!response.ok) throw new Error('Failed to update todo');
      await fetchTodos();
      await fetchStats();
      setError('');
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete todo');
      await fetchTodos();
      await fetchStats();
      setError('');
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const clearCompleted = async () => {
    try {
      const response = await fetch('/api/todos', {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear completed');
      await fetchTodos();
      await fetchStats();
      setError('');
    } catch (err) {
      setError('Erreur lors du nettoyage');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '🔥 Urgent';
      case 'HIGH': return '⚠️ Haute';
      case 'MEDIUM': return '📌 Moyenne';
      default: return '✅ Basse';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !todos.find(t => t.dueDate === dueDate)?.done;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-content">
            <h1>✨ Gestionnaire de Tâches</h1>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.active}</div>
                <div className="stat-label">Actives</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Complétées</div>
              </div>
              <div className="stat-card stat-overdue">
                <div className="stat-value">{stats.overdue}</div>
                <div className="stat-label">En retard</div>
              </div>
            </div>
          )}
        </header>

        {error && <div className="error">{error}</div>}

        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Rechercher..."
            className="search-input"
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Toutes
            </button>
            <button 
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Actives
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Complétées
            </button>
          </div>

          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">📁 Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">🎯 Toutes priorités</option>
            <option value="URGENT">🔥 Urgent</option>
            <option value="HIGH">⚠️ Haute</option>
            <option value="MEDIUM">📌 Moyenne</option>
            <option value="LOW">✅ Basse</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="createdAt">📅 Date création</option>
            <option value="priority">🎯 Priorité</option>
            <option value="dueDate">⏰ Échéance</option>
          </select>
        </div>

        <button 
          className="add-btn-toggle"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Annuler' : '+ Nouvelle tâche'}
        </button>

        {showAddForm && (
          <form onSubmit={addTodo} className="add-form">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Titre de la tâche..."
              disabled={loading}
              required
            />
            
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optionnel)"
              disabled={loading}
              rows={3}
            />

            <div className="form-row">
              <select 
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                disabled={loading}
              >
                <option value="LOW">✅ Basse</option>
                <option value="MEDIUM">📌 Moyenne</option>
                <option value="HIGH">⚠️ Haute</option>
                <option value="URGENT">🔥 Urgent</option>
              </select>

              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={loading}
              >
                <option value="">Catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '⏳ Ajout...' : '✓ Ajouter'}
            </button>
          </form>
        )}

        <ul className="todos-list">
          {todos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.done ? 'done' : ''} ${getPriorityColor(todo.priority)} ${isOverdue(todo.dueDate) ? 'overdue' : ''}`}>
              <div className="todo-checkbox">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id, todo.done)}
                />
              </div>
              
              <div className="todo-content">
                <div className="todo-header">
                  <span className="todo-title">{todo.title}</span>
                  <div className="todo-badges">
                    <span className="priority-badge">{getPriorityLabel(todo.priority)}</span>
                    {todo.category && <span className="category-badge">📁 {todo.category}</span>}
                  </div>
                </div>
                
                {todo.description && (
                  <p className="todo-description">{todo.description}</p>
                )}
                
                <div className="todo-meta">
                  {todo.dueDate && (
                    <span className={`due-date ${isOverdue(todo.dueDate) ? 'overdue' : ''}`}>
                      ⏰ {formatDate(todo.dueDate)}
                    </span>
                  )}
                  <span className="created-date">
                    Créée le {formatDate(todo.createdAt)}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => deleteTodo(todo.id)} 
                className="delete-btn"
                aria-label="Supprimer"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>Aucune tâche pour le moment</p>
            <p className="empty-subtitle">Commencez par créer votre première tâche !</p>
          </div>
        )}

        {stats && stats.completed > 0 && (
          <button onClick={clearCompleted} className="clear-completed">
            🧹 Nettoyer les tâches complétées ({stats.completed})
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
