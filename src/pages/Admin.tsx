import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trash2, FileCode, ExternalLink, Pencil, X, AlertTriangle, Users, LayoutTemplate, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

interface PageDoc {
  id: string;
  path: string;
  htmlContent: string;
  createdAt: string;
  updatedAt?: string;
}

export default function Admin() {
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'pages' | 'users'>('pages');
  
  const [pages, setPages] = useState<PageDoc[]>([]);
  const [path, setPath] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      setErrorMsg('');
      const querySnapshot = await getDocs(collection(db, 'custom_pages'));
      const pagesData: PageDoc[] = [];
      querySnapshot.forEach((doc) => {
        pagesData.push({ id: doc.id, ...doc.data() } as PageDoc);
      });
      setPages(pagesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error: any) {
      console.error("Error fetching pages:", error);
      if (error.message?.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
        setErrorMsg('Firebase Permission Denied. You must update your Firestore Security Rules to allow read/write access to the "custom_pages" collection.');
      } else {
        setErrorMsg(error.message || 'Failed to connect to Firebase.');
      }
    }
  };

  useEffect(() => {
    if (user && activeTab === 'pages') {
      fetchPages();
    }
  }, [activeTab, user]);

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setPath('');
    setFile(null);
    setEditingId(null);
    setLoading(false);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!path) return;
    if (!editingId && !file) return; // File is required for new pages, optional for updates

    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    setLoading(true);
    setErrorMsg('');

    try {
      // Check if path already exists for a DIFFERENT document
      const q = query(collection(db, 'custom_pages'), where('path', '==', cleanPath));
      const existing = await getDocs(q);
      const duplicate = existing.docs.find(d => d.id !== editingId);
      
      if (duplicate) {
        setErrorMsg('A page with this URL path already exists! Please choose a different path.');
        setLoading(false);
        return;
      }

      if (editingId) {
        // UPDATE EXISTING PAGE
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const htmlContent = event.target?.result as string;
            await updateDoc(doc(db, 'custom_pages', editingId), {
              path: cleanPath,
              htmlContent,
              updatedAt: new Date().toISOString()
            });
            resetForm();
            fetchPages();
          };
          reader.readAsText(file);
        } else {
          // Update path only, keep existing HTML
          await updateDoc(doc(db, 'custom_pages', editingId), {
            path: cleanPath,
            updatedAt: new Date().toISOString()
          });
          resetForm();
          fetchPages();
        }
      } else {
        // CREATE NEW PAGE
        const reader = new FileReader();
        reader.onload = async (event) => {
          const htmlContent = event.target?.result as string;
          await addDoc(collection(db, 'custom_pages'), {
            path: cleanPath,
            htmlContent,
            createdAt: new Date().toISOString()
          });
          resetForm();
          fetchPages();
        };
        reader.readAsText(file!);
      }
    } catch (error: any) {
      console.error("Error saving page: ", error);
      if (error.message?.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
        setErrorMsg('Firebase Permission Denied. You must update your Firestore Security Rules.');
      } else {
        setErrorMsg("Failed to save page.");
      }
      setLoading(false);
    }
  };

  const handleEdit = (page: PageDoc) => {
    setEditingId(page.id);
    setPath(page.path);
    setFile(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, 'custom_pages', deletingId));
      if (editingId === deletingId) resetForm();
      fetchPages();
      setDeletingId(null);
    } catch (error: any) {
      console.error("Error deleting document: ", error);
      if (error.message?.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
        setErrorMsg('Firebase Permission Denied. You must update your Firestore Security Rules.');
      } else {
        setErrorMsg("Failed to delete page.");
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full">
      {/* Delete Confirmation Modal */}
      {deletingId && activeTab === 'pages' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete Page?</h3>
            <p className="text-brand-400 mb-6">Are you sure you want to delete this page? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-medium text-brand-300 hover:text-white bg-brand-800 hover:bg-brand-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-brand-400">Welcome back, {user.name} ({user.role})</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-brand-400 hover:text-brand-300 text-sm font-medium whitespace-nowrap">
            &larr; Back to Home
          </Link>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-brand-800 pb-px">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-5 py-3 text-sm font-medium rounded-t-xl flex items-center gap-2 transition-colors ${
            activeTab === 'pages' 
              ? 'bg-brand-900 text-white border-t border-x border-brand-800' 
              : 'text-brand-400 hover:text-brand-200 hover:bg-brand-900/50'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Pages
        </button>
        {user.role === 'Admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 text-sm font-medium rounded-t-xl flex items-center gap-2 transition-colors ${
              activeTab === 'users' 
                ? 'bg-brand-900 text-white border-t border-x border-brand-800' 
                : 'text-brand-400 hover:text-brand-200 hover:bg-brand-900/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        )}
      </div>

      {activeTab === 'users' && user.role === 'Admin' ? (
        <AdminUsers />
      ) : (
        <>
          {errorMsg && (
            <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Error</h3>
                  <p className="text-sm mb-3">{errorMsg}</p>
                  {errorMsg.includes('Permission Denied') && (
                    <div className="bg-brand-950 p-4 rounded-lg border border-red-500/20 font-mono text-xs text-brand-300 overflow-x-auto">
                      <p className="text-brand-400 mb-2">// Go to Firebase Console &gt; Firestore Database &gt; Rules, and paste this:</p>
                      <code>
                        rules_version = '2';<br/>
                        service cloud.firestore {'{'}<br/>
                        &nbsp;&nbsp;match /databases/{'{database}'}/documents {'{'}<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;match /custom_pages/{'{document=**}'} {'{'}<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true; // Note: Secure this before production!<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
                        &nbsp;&nbsp;{'}'}<br/>
                        {'}'}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload/Edit Form */}
            <div className="lg:col-span-1">
              <div className="bg-brand-900 border border-white/10 rounded-2xl p-6 shadow-xl sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    {editingId ? <Pencil className="w-5 h-5 text-brand-400" /> : <FileCode className="w-5 h-5 text-brand-400" />}
                    {editingId ? 'Edit Page' : 'Upload New Page'}
                  </h2>
                  {editingId && (
                    <button onClick={resetForm} className="text-brand-400 hover:text-white transition-colors" title="Cancel Edit">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-brand-300 mb-1">URL Path</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-brand-500 sm:text-sm">/</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={path}
                        onChange={(e) => setPath(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                        className="block w-full pl-7 pr-3 py-2.5 border border-brand-700 rounded-xl bg-brand-950 text-white placeholder-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all"
                        placeholder="faq"
                      />
                    </div>
                    <p className="mt-1 text-xs text-brand-500">Only letters, numbers, dashes, and underscores.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-300 mb-1">
                      HTML File {editingId && <span className="text-brand-500 font-normal">(Optional - leave empty to keep current)</span>}
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".html"
                      required={!editingId}
                      onChange={handleFileChange}
                      className="block w-full text-sm text-brand-400
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-brand-500/10 file:text-brand-400
                        hover:file:bg-brand-500/20 file:transition-colors
                        border border-brand-700 rounded-xl bg-brand-950 p-1"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !path || (!editingId && !file)}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-brand-950 bg-accent-500 hover:bg-accent-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-900 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? 'Saving...' : (editingId ? 'Update Page' : 'Upload & Publish')}
                  </button>
                </form>
              </div>
            </div>

            {/* Pages List */}
            <div className="lg:col-span-2">
              <div className="bg-brand-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-brand-800/50">
                  <h3 className="text-lg font-medium text-white">Published Pages</h3>
                  <span className="bg-brand-500/20 text-brand-300 py-1 px-2.5 rounded-full text-xs font-medium">
                    {pages.length} Total
                  </span>
                </div>
                
                {pages.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileCode className="mx-auto h-12 w-12 text-brand-600 mb-3" />
                    <p className="text-brand-400">No custom pages uploaded yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {pages.map((page) => (
                      <li key={page.id} className={`px-6 py-4 hover:bg-brand-800/50 transition-colors flex items-center justify-between ${editingId === page.id ? 'bg-brand-500/5' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="bg-brand-950 p-2 rounded-lg border border-white/5">
                            <FileCode className="h-5 w-5 text-brand-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white flex items-center gap-2">
                              /{page.path}
                              <a href={`/${page.path}`} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-400 transition-colors" title="View Page">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </p>
                            <p className="text-xs text-brand-500 mt-0.5">
                              {page.updatedAt ? `Updated ${new Date(page.updatedAt).toLocaleDateString()}` : `Created ${new Date(page.createdAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.role !== 'Viewer' && (
                            <button
                              onClick={() => handleEdit(page)}
                              className="p-2 text-brand-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"
                              title="Edit page"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {user.role === 'Admin' && (
                            <button
                              onClick={() => setDeletingId(page.id)}
                              className="p-2 text-brand-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Delete page"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
