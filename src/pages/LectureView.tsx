import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Gamepad2, MessageSquare, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LectureView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<any>(null);
  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const docRef = doc(db, 'lectures', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setLecture({ id: docSnap.id, ...docSnap.data() });
          
          // Fetch associated flashcard deck
          const q = query(collection(db, 'flashcards'), where('lectureId', '==', id));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setDeck({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          }
        } else {
          toast.error("Lecture not found");
          navigate('/');
        }
      } catch (err) {
        toast.error("Error loading lecture");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!lecture) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-[#162c4c] p-8 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold">{lecture.title}</h1>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl text-blue-200 mb-4 font-semibold">AI Summary</h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap bg-[#0f2139] p-6 rounded-xl border border-white/5">
                {lecture.summary}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-200 mb-4">Study Tools</h3>
          
          {deck && (
            <Link 
              to={`/flashcards/${deck.id}`}
              className="block bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl border border-white/10 hover:scale-[1.02] transition-transform shadow-lg shadow-blue-900/50"
            >
              <Gamepad2 className="w-8 h-8 mb-4 text-white" />
              <h4 className="text-xl font-bold mb-1">Play Flashcards</h4>
              <p className="text-blue-100 text-sm opacity-90">
                Difficulty: <span className="font-bold">{deck.difficulty}</span>
              </p>
            </Link>
          )}

          <Link 
            to={`/chat/${lecture.id}`}
            className="block bg-[#162c4c] p-6 rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-[#1a365d] transition-all shadow-lg"
          >
            <MessageSquare className="w-8 h-8 mb-4 text-blue-400" />
            <h4 className="text-xl font-bold mb-1">AI Tutor Chat</h4>
            <p className="text-blue-200 text-sm">
              Ask questions and discuss this lecture.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
