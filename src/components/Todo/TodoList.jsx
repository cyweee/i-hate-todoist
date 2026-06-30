import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const PRIORITY_CONFIG = {
    high: { color: 'bg-[#a63d40]', border: 'border-[#a63d40]', text: 'text-[#a63d40]', label: 'High' },
    medium: { color: 'bg-[#d18b47]', border: 'border-[#d18b47]', text: 'text-[#d18b47]', label: 'Medium' },
    low: { color: 'bg-[#546ca4]', border: 'border-[#546ca4]', text: 'text-[#546ca4]', label: 'Low' },
};

const PROJECT_COLORS = [
    '#546ca4',
    '#52b788',
    '#d18b47',
    '#a63d40',
    '#9d4edd',
    '#e07a5f',
    '#f4a261',
    '#00b4d8',
];

export default function TodoList({ user, onTaskUpdated }) {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [activeTab, setActiveTab] = useState('active');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [priority, setPriority] = useState('low');
    const [selectedProjectId, setSelectedProjectId] = useState('');

    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
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
            .insert([{
                user_id: user.id,
                name: newProjectName,
                color: newProjectColor
            }])
            .select();

        if (data && data.length > 0) {
            setProjects([...projects, data[0]]);
            setSelectedProjectId(data[0].id);
            setNewProjectName('');
            setNewProjectColor(PROJECT_COLORS[0]);
            setShowProjectForm(false);
            if (onTaskUpdated) onTaskUpdated('Project created!');
        }
        if (error) console.error('Error adding project:', error);
    };

    const deleteProject = async () => {
        if (!selectedProjectId) return;

        const confirmDelete = window.confirm("Are you sure you want to delete this project? Your tasks will be moved to Inbox.");
        if (!confirmDelete) return;

        setProjects(projects.filter(p => p.id !== selectedProjectId));
        setTasks(tasks.map(t => t.project_id === selectedProjectId ? { ...t, project_id: null } : t));
        setSelectedProjectId('');

        const { error } = await supabase.from('projects').delete().eq('id', selectedProjectId);
        if (error) {
            fetchProjects();
        } else {
            if (onTaskUpdated) onTaskUpdated('Project deleted');
        }
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
            if (onTaskUpdated) onTaskUpdated('Task added!');
        }
        if (error) console.error('Error adding task:', error);
    };

    const toggleTask = async (id, currentStatus) => {
        const task = tasks.find(t => t.id === id);
        const xpPoints = { high: 20, medium: 15, low: 10 }[task.priority] || 10;

        if (currentStatus) {
            const { data: userData } = await supabase.from('user_settings').select('xp').eq('user_id', user.id).single();
            await supabase.from('user_settings').update({ xp: Math.max(0, (userData?.xp || 0) - xpPoints) }).eq('user_id', user.id);

            setTasks(tasks.map(t => t.id === id ? { ...t, completed: false, completed_at: null } : t));
            // Заодно стираем "штамп" цели, если снимаем галочку
            await supabase.from('tasks').update({ completed: false, completed_at: null, current_daily_goal: null }).eq('id', id);

            if (onTaskUpdated) onTaskUpdated(`Task unmarked. -${xpPoints} XP`);
            return;
        }

        const completedAt = new Date().toISOString();
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: true, completed_at: completedAt } : t));

        // ДОСТАЕМ НЕ ТОЛЬКО XP, НО И DAILY_GOAL
        const { data: userData } = await supabase.from('user_settings').select('xp, daily_goal').eq('user_id', user.id).single();
        const currentGoal = userData?.daily_goal || 3;

        await supabase.from('user_settings').update({ xp: (userData?.xp || 0) + xpPoints }).eq('user_id', user.id);

        // СОХРАНЯЕМ В ЗАДАЧУ current_daily_goal
        await supabase.from('tasks').update({
            completed: true,
            completed_at: completedAt,
            current_daily_goal: currentGoal // <--- Вот наш секретный штамп
        }).eq('id', id);

        if (onTaskUpdated) onTaskUpdated(`Task completed! +${xpPoints} XP`);
    };

    const deleteTask = async (id) => {
        const taskToDelete = tasks.find(t => t.id === id);

        const { data, error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .select();

        if (error || !data || data.length === 0) {
            console.error('Error deleting task:', error);
            if (onTaskUpdated) onTaskUpdated('Failed to delete task');
            return;
        }

        setTasks(tasks.filter(t => t.id !== id));

        if (taskToDelete && taskToDelete.completed) {
            const xpPoints = { high: 20, medium: 15, low: 10 }[taskToDelete.priority] || 10;

            const { data: userData } = await supabase
                .from('user_settings')
                .select('xp')
                .eq('user_id', user.id)
                .single();

            await supabase
                .from('user_settings')
                .update({ xp: Math.max(0, (userData?.xp || 0) - xpPoints) })
                .eq('user_id', user.id);

            if (onTaskUpdated) onTaskUpdated(`Task deleted! -${xpPoints} XP`);
        } else {
            if (onTaskUpdated) onTaskUpdated('Task deleted');
        }
    };

    const displayedTasks = tasks.filter(t => activeTab === 'active' ? !t.completed : t.completed);

    const getProject = (projectId) => {
        if (!projectId) return null;
        return projects.find(p => p.id === projectId) || null;
    };

    // Обработчик горячих клавиш (Ctrl+B)
    const handleDescriptionKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;

            const newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
            setDescription(newText);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + 2, end + 2);
            }, 0);
        }
    };

    // Форматирование Markdown-подобного текста
    const formatDescription = (text) => {
        if (!text) return null;

        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();
            const isListItem = trimmed.startsWith('- ');
            let content = isListItem ? trimmed.substring(2) : line;

            const parts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-bold text-gray-200">{part.slice(2, -2)}</strong>;
                }
                return part;
            });

            if (isListItem) {
                return (
                    <div key={i} className="flex items-start gap-2 mt-1">
                        <span className="text-[10px] mt-1 text-acc1">●</span>
                        <span>{parts}</span>
                    </div>
                );
            }

            return <div key={i} className="min-h-[1.25rem]">{parts}</div>;
        });
    };

    return (
        <div className="bg-bgSec p-6 rounded-xl border border-acc2 mb-6 text-left shadow-lg">
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

            {activeTab === 'active' && (
                <div className="mb-8 bg-bgMain p-4 rounded-lg border border-acc2">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-acc2">
                        <div className="flex items-center gap-2">
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

                            {selectedProjectId && (
                                <button
                                    type="button"
                                    onClick={deleteProject}
                                    className="text-gray-500 hover:text-[#a63d40] transition-colors"
                                    title="Delete this project"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowProjectForm(!showProjectForm)}
                            className="text-xs text-acc1 hover:text-white transition-colors"
                        >
                            {showProjectForm ? 'Cancel' : '+ New Project'}
                        </button>
                    </div>

                    {showProjectForm && (
                        <form onSubmit={addProject} className="flex flex-col gap-3 mb-6 bg-bgSec p-3 rounded-lg border border-acc2">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Project Name..."
                                className="w-full bg-bgMain border border-acc2 px-3 py-2 text-sm rounded text-white focus:outline-none focus:border-acc1"
                                autoFocus
                            />
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    {PROJECT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewProjectColor(color)}
                                            style={{ backgroundColor: color }}
                                            className={`w-6 h-6 rounded-full transition-transform ${
                                                newProjectColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-bgSec' : 'hover:scale-110 opacity-70 hover:opacity-100'
                                            }`}
                                            title={`Select color ${color}`}
                                        />
                                    ))}
                                </div>
                                <button type="submit" className="bg-acc1 text-white px-4 py-1.5 rounded text-sm hover:bg-acc3 transition-colors">
                                    Save Project
                                </button>
                            </div>
                        </form>
                    )}

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
                            onKeyDown={handleDescriptionKeyDown}
                            placeholder="Description (use '- ' for list, Ctrl+B for bold)"
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

            <ul className="space-y-3">
                {displayedTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {activeTab === 'active' ? "No active tasks. You're all caught up!" : "No completed tasks yet."}
                    </p>
                ) : (
                    displayedTasks.map((task) => {
                        const project = getProject(task.project_id);

                        return (
                            <li
                                key={task.id}
                                style={!task.completed && project ? { borderColor: project.color } : {}}
                                className={`flex items-start justify-between space-x-4 p-4 rounded-lg border transition-colors group relative ${
                                    task.completed
                                        ? 'bg-bgSec border-transparent opacity-60'
                                        : 'bg-bgMain hover:opacity-90'
                                } ${!project && !task.completed ? 'border-acc2 hover:border-acc1' : ''}`}
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
                                            {project && (
                                                <span
                                                    style={{ backgroundColor: project.color }}
                                                    className="text-[10px] uppercase tracking-wider text-white px-2 py-0.5 rounded-sm ml-2 opacity-90"
                                                >
                                                    {project.name}
                                                </span>
                                            )}
                                        </div>

                                        {task.description && (
                                            <div className={`text-sm mt-2 ${task.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {formatDescription(task.description)}
                                            </div>
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
                        );
                    })
                )}
            </ul>
        </div>
    );
}