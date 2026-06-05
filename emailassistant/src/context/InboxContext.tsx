import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { Email, EmailStatus, EmailTag } from '../types/email';
import type { Draft } from '../types/draft';
import { saveEmailTag, loadEmailTag, saveEmailStatus, loadEmailStatus } from '../utils/tokenStorage';

interface InboxState {
  emails: Email[];
  isLoading: boolean;
  error: string | null;
  statusFilter: EmailStatus | 'all';
  tagFilter: EmailTag | 'all';
  draft: Draft | null;
}

type InboxAction =
  | { type: 'SET_EMAILS'; payload: Email[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_EMAIL_STATUS'; payload: { id: string; status: EmailStatus } }
  | { type: 'UPDATE_EMAIL_TAG'; payload: { id: string; tag: EmailTag } }
  | { type: 'UPDATE_URGENCY_BATCH'; payload: { id: string; urgency: 1 | 2 | 3 }[] }
  | { type: 'SET_STATUS_FILTER'; payload: EmailStatus | 'all' }
  | { type: 'SET_TAG_FILTER'; payload: EmailTag | 'all' }
  | { type: 'SET_DRAFT'; payload: Draft | null }
  | { type: 'CLEAR_DRAFT' }
  | { type: 'REMOVE_EMAIL'; payload: string };

function inboxReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case 'SET_EMAILS':
      // Rehydrate tags and statuses from localStorage for each email
      return {
        ...state,
        emails: action.payload.map((email) => {
          const savedTag = loadEmailTag(email.id) as EmailTag;
          const savedStatus = loadEmailStatus(email.id) as EmailStatus | null;
          return {
            ...email,
            ...(savedTag ? { tag: savedTag } : {}),
            ...(savedStatus ? { status: savedStatus } : {}),
          };
        }),
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'UPDATE_EMAIL_STATUS':
      saveEmailStatus(action.payload.id, action.payload.status);
      return {
        ...state,
        emails: state.emails.map((e) =>
          e.id === action.payload.id ? { ...e, status: action.payload.status } : e
        ),
      };
    case 'UPDATE_EMAIL_TAG':
      // Persist tag change to LocalStorage
      saveEmailTag(action.payload.id, action.payload.tag);
      return {
        ...state,
        emails: state.emails.map((e) =>
          e.id === action.payload.id ? { ...e, tag: action.payload.tag } : e
        ),
      };
    case 'UPDATE_URGENCY_BATCH': {
      const urgencyMap = new Map(action.payload.map((item) => [item.id, item.urgency]));
      return {
        ...state,
        emails: state.emails.map((e) =>
          urgencyMap.has(e.id) ? { ...e, urgency: urgencyMap.get(e.id)! } : e
        ),
      };
    }
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };
    case 'SET_TAG_FILTER':
      return { ...state, tagFilter: action.payload };
    case 'SET_DRAFT':
      return { ...state, draft: action.payload };
    case 'CLEAR_DRAFT':
      return { ...state, draft: null };
    case 'REMOVE_EMAIL':
      return { ...state, emails: state.emails.filter((e) => e.id !== action.payload) };
    default:
      return state;
  }
}

interface InboxContextValue {
  emails: Email[];
  isLoading: boolean;
  error: string | null;
  statusFilter: EmailStatus | 'all';
  tagFilter: EmailTag | 'all';
  draft: Draft | null;
  setEmails: (emails: Email[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateEmailStatus: (id: string, status: EmailStatus) => void;
  updateEmailTag: (id: string, tag: EmailTag) => void;
  updateUrgencyBatch: (items: { id: string; urgency: 1 | 2 | 3 }[]) => void;
  setStatusFilter: (filter: EmailStatus | 'all') => void;
  setTagFilter: (filter: EmailTag | 'all') => void;
  setDraft: (draft: Draft | null) => void;
  clearDraft: () => void;
  removeEmail: (id: string) => void;
}

const InboxContext = createContext<InboxContextValue | null>(null);

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(inboxReducer, {
    emails: [],
    isLoading: false,
    error: null,
    statusFilter: 'all',
    tagFilter: 'all',
    draft: null,
  });

  // dispatch is stable, so these callbacks never need to change identity
  const setEmails = useCallback((emails: Email[]) => dispatch({ type: 'SET_EMAILS', payload: emails }), []);
  const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const updateEmailStatus = useCallback((id: string, status: EmailStatus) => dispatch({ type: 'UPDATE_EMAIL_STATUS', payload: { id, status } }), []);
  const updateEmailTag = useCallback((id: string, tag: EmailTag) => dispatch({ type: 'UPDATE_EMAIL_TAG', payload: { id, tag } }), []);
  const updateUrgencyBatch = useCallback((items: { id: string; urgency: 1 | 2 | 3 }[]) => dispatch({ type: 'UPDATE_URGENCY_BATCH', payload: items }), []);
  const setStatusFilter = useCallback((filter: EmailStatus | 'all') => dispatch({ type: 'SET_STATUS_FILTER', payload: filter }), []);
  const setTagFilter = useCallback((filter: EmailTag | 'all') => dispatch({ type: 'SET_TAG_FILTER', payload: filter }), []);
  const setDraft = useCallback((draft: Draft | null) => dispatch({ type: 'SET_DRAFT', payload: draft }), []);
  const clearDraft = useCallback(() => dispatch({ type: 'CLEAR_DRAFT' }), []);
  const removeEmail = useCallback((id: string) => dispatch({ type: 'REMOVE_EMAIL', payload: id }), []);

  const value = useMemo<InboxContextValue>(() => ({
    ...state,
    setEmails,
    setLoading,
    setError,
    updateEmailStatus,
    updateEmailTag,
    updateUrgencyBatch,
    setStatusFilter,
    setTagFilter,
    setDraft,
    clearDraft,
    removeEmail,
  }), [state, setEmails, setLoading, setError, updateEmailStatus, updateEmailTag, updateUrgencyBatch, setStatusFilter, setTagFilter, setDraft, clearDraft, removeEmail]);

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxContextValue {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error('useInbox must be used within InboxProvider');
  return ctx;
}
