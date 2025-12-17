import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Trash2, Calendar as CalendarIcon, Clock, Bell } from 'lucide-react';
import { Note, Task, Reminder, ViewState } from '../types';
import { generateText } from '../services/geminiService';

export const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Load notes from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
  }, []);

  // Save notes to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!title.trim() && !content.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      title: title || 'Untitled',
      content,
      timestamp: Date.now()
    };
    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
  };

  const enhanceWithAI = async () => {
    if (!content) return;
    setAiLoading(true);
    const result = await generateText(`Rewrite this note to be more concise and structured:\n\n${content}`);
    setContent(result);
    setAiLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[600px]">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-accent rounded-full"></span>
          Editor
        </h2>
        <input 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="text-lg font-bold mb-4 p-2 border-b border-transparent focus:border-gray-200 outline-none"
        />
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing..."
          className="flex-1 resize-none outline-none text-gray-600 leading-relaxed p-2"
        />
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <button 
            onClick={addNote}
            className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90"
          >
            Save Note
          </button>
          <button 
            onClick={enhanceWithAI}
            disabled={aiLoading}
            className="px-4 py-2 border border-accent text-accent rounded-lg font-medium hover:bg-accent/5 disabled:opacity-50"
          >
            {aiLoading ? '...' : 'AI Polish'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[600px] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Saved Notes</h2>
        {notes.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">No notes yet.</div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow relative group">
                <button 
                  onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
                <h3 className="font-bold text-gray-800">{note.title}</h3>
                <p className="text-gray-600 text-sm mt-2 line-clamp-3">{note.content}</p>
                <span className="text-xs text-gray-400 mt-3 block">{new Date(note.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PlannerApp = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [generating, setGenerating] = useState(false);

  // Load tasks from local storage
  useEffect(() => {
    const saved = localStorage.getItem('planner_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
  }, []);

  // Save tasks
  useEffect(() => {
    localStorage.setItem('planner_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }]);
    setNewTask('');
  };

  const generatePlan = async () => {
    setGenerating(true);
    const prompt = "Generate a productive daily schedule for a software engineer. Output as a list of tasks separated by newlines.";
    const result = await generateText(prompt);
    
    const aiTasks = result.split('\n')
      .filter(line => line.trim().length > 0)
      .map((text, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        text: text.replace(/^[-*•]\s*/, ''), // Remove bullets
        completed: false
      }));
    
    setTasks([...tasks, ...aiTasks]);
    setGenerating(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-deepBlue to-primary rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Daily Focus</h2>
          <p className="opacity-80 mb-6">Stay organized and productive with AI assistance.</p>
          <button 
            onClick={generatePlan}
            disabled={generating}
            className="bg-white text-primary px-6 py-2 rounded-full font-bold hover:bg-opacity-90 transition-all flex items-center gap-2"
          >
            {generating ? 'Thinking...' : <><CalendarIcon size={18} /> Generate Day Plan</>}
          </button>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
          <CalendarIcon size={200} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-3 mb-6">
          <input 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-primary"
            placeholder="Add a new task..."
          />
          <button 
            onClick={addTask}
            className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90"
          >
            <Plus />
          </button>
        </div>

        <div className="space-y-2">
          {tasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                task.completed ? 'bg-gray-50 border-transparent' : 'bg-white border-gray-100 hover:shadow-sm'
              }`}
            >
              <div className={`text-${task.completed ? 'gray-400' : 'primary'}`}>
                {task.completed ? <CheckCircle /> : <Circle />}
              </div>
              <span className={`flex-1 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.text}
              </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              No tasks for today. Add one or ask AI to plan your day!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface RemindersAppProps {
  onNavigate: (view: ViewState) => void;
}

export const RemindersApp: React.FC<RemindersAppProps> = ({ onNavigate }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Load reminders from local storage
  useEffect(() => {
    const saved = localStorage.getItem('local_reminders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReminders(parsed.sort((a: Reminder, b: Reminder) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()));
      } catch (e) {
        console.error("Failed to parse reminders", e);
      }
    }
  }, []);

  // Save reminders to local storage
  useEffect(() => {
    localStorage.setItem('local_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = () => {
    if (!text.trim() || !date || !time) {
      return;
    }
    const datetime = `${date}T${time}`;
    const newReminder: Reminder = {
      id: Date.now().toString(),
      text,
      datetime,
      completed: false,
    };
    
    setReminders([...reminders, newReminder].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()));
    setText('');
    setDate('');
    setTime('');
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const toggleReminder = (id: string, currentStatus: boolean) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !currentStatus } : r));
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">My Reminders</h2>
           <p className="text-gray-500 text-sm">Stored locally on your device</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Set New Reminder</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Remind me to..."
            className="md:col-span-2 p-3 border border-gray-200 rounded-lg outline-none focus:border-primary"
          />
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-3 border border-gray-200 rounded-lg outline-none focus:border-primary"
          />
          <input 
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="p-3 border border-gray-200 rounded-lg outline-none focus:border-primary"
          />
        </div>
        <button 
          onClick={addReminder}
          className="mt-4 w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Set Reminder
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-700 ml-2">Upcoming</h3>
        {reminders.map(reminder => (
          <div key={reminder.id} className={`bg-white p-4 rounded-xl shadow-sm border ${reminder.completed ? 'border-gray-100 opacity-60' : 'border-l-4 border-l-primary border-gray-100'} flex items-center justify-between group`}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleReminder(reminder.id, reminder.completed)}
                className={`text-${reminder.completed ? 'gray-400' : 'primary'} hover:scale-110 transition-transform`}
              >
                {reminder.completed ? <CheckCircle /> : <Circle />}
              </button>
              <div>
                <p className={`font-medium ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{reminder.text}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Clock size={12} />
                  <span>{new Date(reminder.datetime).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => deleteReminder(reminder.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            No active reminders.
          </div>
        )}
      </div>
    </div>
  );
};