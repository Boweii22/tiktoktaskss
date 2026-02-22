import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import './CreateTaskModal.css';

const TASK_TEMPLATES = [
  { type: 'timing', name: 'Hold', desc: 'Hold for X seconds. Release too early or too late = fail.' },
  { type: 'reaction', name: 'React', desc: 'Tap as soon as it turns green. Tight time window.' },
  { type: 'hesitation', name: 'Quick', desc: 'Tap within X ms of start. Hesitate = fail.' },
  { type: 'precision', name: 'Exact', desc: 'Slide to a target value. Tiny tolerance.' },
  { type: 'rapid', name: 'Speed', desc: 'Tap N times in X seconds. Not N-1. Not N+1.' },
  { type: 'misleading', name: 'Read', desc: 'Text says something misleading. Do the opposite.' },
  { type: 'follow_literal', name: 'Literal', desc: 'Follow the instruction literally. Tricky wording.' },
  { type: 'wait', name: 'Wait', desc: 'Tap only when the button appears. Patience required.' },
];

// Community submissions only support these types (backend-reviewed)
const SUBMISSION_TYPES = ['timing', 'reaction', 'hesitation', 'precision', 'rapid'];

export function CreateTaskModal({ onClose, onCreated, mode = 'create', task: editTask }) {
  // mode: 'create' | 'propose' | 'edit'
  const isPropose = mode === 'propose';
  const isEdit = mode === 'edit';
  const templates = isPropose ? TASK_TEMPLATES.filter((t) => SUBMISSION_TYPES.includes(t.type)) : TASK_TEMPLATES;
  const [name, setName] = useState(editTask?.name || '');
  const [instruction, setInstruction] = useState(editTask?.instruction || '');
  const [taskType, setTaskType] = useState(editTask?.type || 'timing');
  const [correctLabel, setCorrectLabel] = useState(editTask?.config?.correct_label || 'Blue');
  const [wrongLabel, setWrongLabel] = useState(editTask?.config?.wrong_label || 'Red');
  const [correctAction, setCorrectAction] = useState(editTask?.config?.correct_action || 'red');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isPropose) {
      setTaskType(prev => (SUBMISSION_TYPES.includes(prev) ? prev : 'timing'));
    }
  }, [isPropose]);

  const getConfig = () => {
    if (taskType === 'follow_literal') {
      return { correct_label: correctLabel.trim() || 'Blue', wrong_label: wrongLabel.trim() || 'Red' };
    }
    if (taskType === 'misleading') {
      return { correct_action: correctAction };
    }
    return {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Task name is required');
      return;
    }
    if (!instruction.trim()) {
      setError('Instruction is required');
      return;
    }
    setSubmitting(true);
    try {
      if (isPropose) {
        await api.submitTaskType(name.trim(), instruction.trim(), taskType, getConfig());
        toast.success('Submitted for review! We\'ll notify when approved.');
        onCreated?.();
        onClose?.();
      } else {
        const task = await api.createTask(name.trim(), instruction.trim(), taskType, getConfig());
        toast.success('Task created! Swipe to find it.');
        onCreated?.(task);
        onClose?.();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || (isEdit ? 'Failed to update' : isPropose ? 'Failed to submit' : 'Failed to create task');
      setError(typeof msg === 'string' ? msg : (isPropose ? 'Failed to submit' : 'Failed to create task'));
      toast.error(typeof msg === 'string' ? msg : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selected = templates.find((t) => t.type === taskType);

  return (
    <motion.div
      className="create-task-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        className="create-task-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-task-header">
          <h2>{isEdit ? 'Edit task' : isPropose ? 'Propose for community' : 'Create a task'}</h2>
          <button type="button" className="create-task-close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-task-form">
          {!isEdit && (
          <div className="create-task-field">
            <label htmlFor="task-type">Task type</label>
            <select
              id="task-type"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.name} – {t.desc}
                </option>
              ))}
            </select>
            {selected && (
              <p className="create-task-hint">{selected.desc}</p>
            )}
          </div>
          )}

          <div className="create-task-field">
            <label htmlFor="task-name">Task name</label>
            <input
              id="task-name"
              type="text"
              placeholder="e.g. Hold 5 Seconds"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="create-task-field">
            <label htmlFor="task-instruction">Instruction (what the player sees)</label>
            <textarea
              id="task-instruction"
              placeholder={taskType === 'follow_literal' ? "e.g. Tap the blue button." : taskType === 'misleading' ? "e.g. Tap the blue button. (The red one says Blue!)" : "e.g. Hold for exactly 5.000 seconds."}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          {taskType === 'follow_literal' && (
            <>
              <div className="create-task-field">
                <label>Correct button label (what player must tap)</label>
                <input
                  type="text"
                  placeholder="e.g. Blue"
                  value={correctLabel}
                  onChange={(e) => setCorrectLabel(e.target.value)}
                  maxLength={30}
                />
              </div>
              <div className="create-task-field">
                <label>Wrong button label</label>
                <input
                  type="text"
                  placeholder="e.g. Red"
                  value={wrongLabel}
                  onChange={(e) => setWrongLabel(e.target.value)}
                  maxLength={30}
                />
              </div>
            </>
          )}

          {taskType === 'misleading' && (
            <div className="create-task-field">
              <label>Which button is actually correct? (trick: both may say same thing)</label>
              <select value={correctAction} onChange={(e) => setCorrectAction(e.target.value)}>
                <option value="red">Red button</option>
                <option value="blue">Blue button</option>
              </select>
            </div>
          )}

          {isPropose && (
            <p className="create-task-hint" style={{ marginTop: 8 }}>
              Approved tasks become playable for everyone. Review usually takes 1–2 days.
            </p>
          )}
          {error && <p className="create-task-error">{error}</p>}

          <motion.button
            type="submit"
            className="create-task-submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            {submitting ? (isEdit ? 'Saving...' : isPropose ? 'Submitting...' : 'Creating...') : (isEdit ? 'Save changes' : isPropose ? 'Submit for review' : 'Create task')}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
