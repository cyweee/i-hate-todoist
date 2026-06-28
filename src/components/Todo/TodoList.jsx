import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const PRIORITY_CONFIG = {
    high: { color: 'bg-[#a63d40]', border: 'border-[#a63d40]', text: 'text-[#a63d40]', label: 'High' },
    medium: { color: 'bg-[#d18b47]', border: 'border-[#d18b47]', text: 'text-[#d18b47]', label: 'Medium' },
    low: { color: 'bg-[#546ca4]', border: 'border-[#546ca4]', text: 'text-[#546ca4]', label: 'Low' },
};

export default function TodoList({ user }) {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

    // States for Task Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [priority, setPriority] = useState('low');
    const [selectedProjectId, setSelectedProjectId] = useState('');

    // States for Project Form
    const [newProjectName, setNewProjectName] = useState('');
    const [showProjectForm, setShowProjectForm] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProjects();
            fetchTasks();
        }
    }, [user]);

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (data) setProjects(data);
        if (error) console.error('Error fetching projects:', error);
    };

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('due_date', { ascending: true })
            .order('created_at', { ascending: false });

        if (data) setTasks(data);
        if (error) console.error('Error fetching tasks:', error);
    };

    const addProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        const { data, error } = await supabase
            .from('projects')
            .insert([{ user_id: user.id, name: newProjectName }])
            .select();

        if (data && data.length > 0) {
            setProjects([...projects, data[0]]);
            setSelectedProjectId(data[0].id); // Auto-select new project
            setNewProjectName('');
            setShowProjectForm(false);
        }
        if (error) console.error('Error adding project:', error);
    };

    const addTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                user_id: user.id,
                title,
                description,
                due_date: dueDate,
                priority,
                project_id: selectedProjectId || null
            }])
            .select();

        if (data && data.length > 0) {
            setTasks([data[0], ...tasks].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
            setTitle('');
            setDescription('');
            setDueDate(new Date().toISOString().split('T')[0]);
            setPriority('low');
        }
        if (error) console.error('Error adding task:', error);
    };

    const toggleTask = async (id, currentStatus) => {
        const completedAt = !currentStatus ? new Date().toISOString() : null;

        setTasks(tasks.map(t =>
            t.id === id ? { ...t, completed: !currentStatus, completed_at: completedAt } : t
        ));

        const { error } = await supabase
            .from('tasks')
            .update({ completed: !currentStatus, completed_at: completedAt })
            .eq('id', id);

        if (error) console.error('Error updating task:', error);
    };

    const deleteTask = async (id) => {
        setTasks(tasks.filter(t => t.id !== id));
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) fetchTasks();
    };

    // Filter tasks based on active tab
    const displayedTasks = tasks.filter(t => activeTab === 'active' ? !t.completed : t.completed);

    // Helper to get project name
    const getProjectName = (projectId) => {
        if (!projectId) return null;
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : null;
    };

    return (
        <div className="bg-bgSec p-6 rounded-xl border border-acc2 mb-6 text-left shadow-lg">

            {/* Tabs Navigation */}
            <div className="flex space-x-4 mb-6 border-b border-acc2 pb-2">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`text-lg font-semibold transition-colors ${activeTab === 'active' ? 'text-white border-b-2 border-acc1 pb-2 -mb-[10px]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Active Tasks
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`text-lg font-semibold transition-colors ${activeTab === 'completed' ? 'text-white border-b-2 border-acc1 pb-2 -mb-[10px]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Completed
                </button>
            </div>

            {/* Task Form (Only show on Active tab) */}
            {activeTab === 'active' && (
                <div className="mb-8 bg-bgMain p-4 rounded-lg border border-acc2">

                    {/* Project Header in Form */}
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-acc2">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-transparent text-gray-300 text-sm focus:outline-none cursor-pointer"
                        >
                            <option value="">No Project (Inbox)</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => setShowProjectForm(!showProjectForm)}
                            className="text-xs text-acc1 hover:text-white transition-colors"
                        >
                            + New Project
                        </button>
                    </div>

                    {/* Inline Project Form */}
                    {showProjectForm && (
                        <form onSubmit={addProject} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Project Name..."
                                className="flex-1 bg-bgSec border border-acc2 px-3 py-1 text-sm rounded text-white focus:outline-none focus:border-acc1"
                                autoFocus
                            />
                            <button type="submit" className="bg-acc1 text-white px-3 py-1 rounded text-sm hover:bg-acc3">Save</button>
                        </form>
                    )}

                    {/* Main Task Form */}
                    <form onSubmit={addTask} className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task Title (e.g., Buy groceries)"
                            className="w-full bg-transparent border-b border-acc2 px-2 py-2 text-white focus:outline-none focus:border-acc1 transition-colors"
                            required
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows="2"
                            className="w-full bg-transparent border-b border-acc2 px-2 py-2 text-gray-300 text-sm focus:outline-none focus:border-acc1 transition-colors resize-none"
                        />

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                            <div className="flex flex-wrap items-center gap-4">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="bg-bgSec text-gray-300 text-sm px-3 py-2 rounded border border-acc2 focus:outline-none focus:border-acc1 cursor-pointer"
                                />

                                <div className="flex gap-2">
                                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setPriority(key)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                priority === key
                                                    ? `${config.color} border-transparent text-white`
                                                    : `bg-transparent ${config.border} ${config.text} opacity-50 hover:opacity-100`
                                            }`}
                                        >
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="bg-acc1 hover:bg-acc3 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
                            >
                                Add Task
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Task List */}
            <ul className="space-y-3">
                {displayedTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {activeTab === 'active' ? "No active tasks. You're all caught up!" : "No completed tasks yet."}
                    </p>
                ) : (
                    displayedTasks.map((task) => (
                        <li
                            key={task.id}
                            className={`flex items-start justify-between space-x-4 p-4 rounded-lg border transition-colors group relative ${
                                task.completed ? 'bg-bgSec border-transparent opacity-60' : 'bg-bgMain border-acc2 hover:border-acc1'
                            }`}
                        >
                            <div className="flex items-start space-x-4 flex-1">
                                <button
                                    onClick={() => toggleTask(task.id, task.completed)}
                                    className={`mt-1 min-w-[20px] w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                                        task.completed
                                            ? 'bg-[#52b788] border-[#52b788]'
                                            : 'border-acc1 hover:bg-acc2'
                                    }`}
                                >
                                    {task.completed && (
                                        <svg className="w-3 h-3 text-bgMain" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>

                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-lg transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                      {task.title}
                    </span>
                                        {!task.completed && (
                                            <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[task.priority || 'low'].color}`}></span>
                                        )}
                                        {/* Project Badge */}
                                        {task.project_id && (
                                            <span className="text-[10px] uppercase tracking-wider bg-acc3 text-white px-2 py-0.5 rounded-sm ml-2">
                        {getProjectName(task.project_id)}
                      </span>
                                        )}
                                    </div>

                                    {task.description && (
                                        <span className={`text-sm mt-1 ${task.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                      {task.description}
                    </span>
                                    )}

                                    {task.due_date && (
                                        <span className="text-xs font-mono text-acc1 mt-2 bg-bgSec border border-acc2 w-fit px-2 py-0.5 rounded">
                      {task.due_date}
                    </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-500 hover:text-[#a63d40] opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-bgSec"
                                title="Delete task"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}