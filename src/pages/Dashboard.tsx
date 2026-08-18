import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FileText, BrainCircuit, ArrowRight, Loader2, Settings2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Settings for generation
  const [difficulty, setDifficulty] = useState('Easy');
  const [questionType, setQuestionType] = useState('multiple_choice');

  const navigate = useNavigate();

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'lectures'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lectures');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return;
    
    setUploading(true);
    const toastId = toast.loading('Uploading and scanning lecture with AI...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('difficulty', difficulty);
      formData.append('type', questionType);

      const res = await fetch('/api/process-lecture', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to process lecture');
      const data = await res.json(); // { summary, flashcards }

      // Save lecture to Firestore
      const lectureRef = await addDoc(collection(db, 'lectures'), {
        userId: auth.currentUser.uid,
        title: file.name,
        summary: data.summary,
        createdAt: Date.now()
      });

      // Save flashcards to Firestore
      await addDoc(collection(db, 'flashcards'), {
        userId: auth.currentUser.uid,
        lectureId: lectureRef.id,
        difficulty: difficulty,
        settings: { type: questionType },
        cards: data.flashcards,
        createdAt: Date.now()
      });

      toast.success('Lecture processed successfully!', { id: toastId });
      setFile(null);
      fetchLectures();
      navigate(`/lecture/${lectureRef.id}`);

    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center py-6 mb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">StudyDash</h1>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Sign Out
        </button>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-[#162c4c] p-6 rounded-2xl border border-white/10 shadow-xl sticky top-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              New Lecture
            </h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="border-2 border-dashed border-blue-500/30 rounded-xl p-8 text-center hover:border-blue-500/60 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.pptx,.txt" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="flex flex-col items-center gap-2 text-blue-200 group-hover:text-blue-100">
                  <FileText className="w-10 h-10 mb-2" />
                  <span className="font-medium">{file ? file.name : 'Select DOCX, PDF, PPTX'}</span>
                  <span className="text-xs opacity-60">Drag and drop or click</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-200 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Generation Settings
                </h3>
                
                <div>
                  <label className="block text-xs mb-1 text-blue-300">Difficulty</label>
                  <select 
                    value={difficulty} 
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full bg-[#0f2139] border border-blue-500/30 rounded-lg p-2 text-sm text-white outline-none"
                  >
                    <option value="Easy">Easy (5 Hearts)</option>
                    <option value="Hard">Hard (3 Hearts)</option>
                    <option value="Expert">Expert (3 Hearts, Harder)</option>
                    <option value="EXTREME">EXTREME (1 Heart, Many Questions)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1 text-blue-300">Question Type</label>
                  <select 
                    value={questionType} 
                    onChange={e => setQuestionType(e.target.value)}
                    className="w-full bg-[#0f2139] border border-blue-500/30 rounded-lg p-2 text-sm text-white outline-none"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="identification">Identification (Fill in)</option>
                    <option value="drag_drop">Drag & Drop (Matching)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {uploading ? 'Processing...' : 'Scan & Generate'}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Your Lectures
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-[#162c4c] h-24 rounded-xl border border-white/5"></div>
              ))}
            </div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-12 text-blue-200/60 bg-[#162c4c] rounded-xl border border-white/5">
              No lectures uploaded yet. Start by uploading a document!
            </div>
          ) : (
            lectures.map(lecture => (
              <Link 
                key={lecture.id} 
                to={`/lecture/${lecture.id}`}
                className="block bg-[#162c4c] p-6 rounded-xl border border-white/10 hover:border-blue-500/50 transition-all hover:-translate-y-1 shadow-lg group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{lecture.title}</h3>
                    <p className="text-sm text-blue-200 line-clamp-1">{lecture.summary}</p>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
