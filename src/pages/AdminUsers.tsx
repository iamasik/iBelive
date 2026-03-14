import { useState, useEffect, FormEvent } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trash2, UserPlus, Pencil, X, AlertTriangle, User as UserIcon } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { useAuth } from '../context/AuthContext';

interface UserDoc {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'Viewer' | 'Editor' | 'Admin';
  createdAt: string;
  updatedAt?: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Viewer' | 'Editor' | 'Admin'>('Viewer');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setErrorMsg('');
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserDoc[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as UserDoc);
      });
      setUsers(usersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (error.message?.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
        setErrorMsg('Firebase Permission Denied. You must update your Firestore Security Rules to allow read/write access to the "users" collection.');
      } else {
        setErrorMsg(error.message || 'Failed to connect to Firebase.');
      }
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      fetchUsers();
    }
  }, [currentUser]);

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-12 text-center bg-brand-900 border border-white/10 rounded-2xl shadow-xl">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-brand-400">Only administrators can manage users.</p>
      </div>
    );
  }

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Viewer');
    setEditingId(null);
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email) return;
    if (!editingId && !password) return; // Password required for new users

    setLoading(true);
    setErrorMsg('');

    try {
      // Check for duplicate username or email
      const qUsername = query(collection(db, 'users'), where('username', '==', username));
      const existingUsernames = await getDocs(qUsername);
      const duplicateUsername = existingUsernames.docs.find(d => d.id !== editingId);
      
      if (duplicateUsername) {
        setErrorMsg('This username is already taken.');
        setLoading(false);
        return;
      }

      const qEmail = query(collection(db, 'users'), where('email', '==', email));
      const existingEmails = await getDocs(qEmail);
      const duplicateEmail = existingEmails.docs.find(d => d.id !== editingId);
      
      if (duplicateEmail) {
        setErrorMsg('This email is already registered.');
        setLoading(false);
        return;
      }

      let hashedPassword = undefined;
      if (password) {
        const salt = bcrypt.genSaltSync(10);
        hashedPassword = bcrypt.hashSync(password, salt);
      }

      if (editingId) {
        // UPDATE EXISTING USER
        const updateData: any = {
          name,
          username,
          email,
          role,
          updatedAt: new Date().toISOString()
        };
        
        if (hashedPassword) {
          updateData.password = hashedPassword;
        }

        await updateDoc(doc(db, 'users', editingId), updateData);
        resetForm();
        fetchUsers();
      } else {
        // CREATE NEW USER
        await addDoc(collection(db, 'users'), {
          name,
          username,
          email,
          password: hashedPassword,
          role,
          createdAt: new Date().toISOString()
        });
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error saving user: ", error);
      if (error.message?.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
        setErrorMsg('Firebase Permission Denied. You must update your Firestore Security Rules.');
      } else {
        setErrorMsg("Failed to save user.");
      }
      setLoading(false);
    }
  };

  const handleEdit = (user: UserDoc) => {
    setEditingId(user.id);
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email);
    setRole(user.role);
    setPassword(''); // Don't populate password field
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, 'users', deletingId));
      if (editingId === deletingId) resetForm();
      fetchUsers();
      setDeletingId(null);
    } catch (error: any) {
      console.error("Error deleting user: ", error);
      if (error.message?.includes('Missing or insufficient permissions') || error.code === 'permission-denied') {
        setErrorMsg('Firebase Permission Denied. You must update your Firestore Security Rules.');
      } else {
        setErrorMsg("Failed to delete user.");
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete User?</h3>
            <p className="text-brand-400 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
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

      {/* Error Message */}
      {errorMsg && (
        <div className="lg:col-span-3 mb-2 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
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
                    &nbsp;&nbsp;&nbsp;&nbsp;match /users/{'{document=**}'} {'{'}<br/>
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

      {/* Upload/Edit Form */}
      <div className="lg:col-span-1">
        <div className="bg-brand-900 border border-white/10 rounded-2xl p-6 shadow-xl sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {editingId ? <Pencil className="w-5 h-5 text-brand-400" /> : <UserPlus className="w-5 h-5 text-brand-400" />}
              {editingId ? 'Edit User' : 'Add New User'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-brand-400 hover:text-white transition-colors" title="Cancel Edit">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2.5 border border-brand-700 rounded-xl bg-brand-950 text-white placeholder-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="block w-full px-3 py-2.5 border border-brand-700 rounded-xl bg-brand-950 text-white placeholder-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2.5 border border-brand-700 rounded-xl bg-brand-950 text-white placeholder-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1">
                Password {editingId && <span className="text-brand-500 font-normal">(Leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                required={!editingId}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2.5 border border-brand-700 rounded-xl bg-brand-950 text-white placeholder-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-300 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'Viewer' | 'Editor' | 'Admin')}
                className="block w-full px-3 py-2.5 border border-brand-700 rounded-xl bg-brand-950 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all appearance-none"
              >
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !name || !username || !email || (!editingId && !password)}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-brand-950 bg-accent-500 hover:bg-accent-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-900 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              {loading ? 'Saving...' : (editingId ? 'Update User' : 'Add User')}
            </button>
          </form>
        </div>
      </div>

      {/* Users List */}
      <div className="lg:col-span-2">
        <div className="bg-brand-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-brand-800/50">
            <h3 className="text-lg font-medium text-white">Registered Users</h3>
            <span className="bg-brand-500/20 text-brand-300 py-1 px-2.5 rounded-full text-xs font-medium">
              {users.length} Total
            </span>
          </div>
          
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-brand-600 mb-3" />
              <p className="text-brand-400">No users added yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {users.map((user) => (
                <li key={user.id} className={`px-6 py-4 hover:bg-brand-800/50 transition-colors flex items-center justify-between ${editingId === user.id ? 'bg-brand-500/5' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-950 p-3 rounded-full border border-white/5">
                      <UserIcon className="h-5 w-5 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {user.name}
                        <span className="text-xs font-normal text-brand-400">@{user.username}</span>
                      </p>
                      <p className="text-xs text-brand-500 mt-0.5">
                        {user.email} • <span className="text-accent-400 font-medium">{user.role}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-brand-400 hover:text-brand-400 hover:bg-brand-400/10 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(user.id)}
                      className="p-2 text-brand-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
