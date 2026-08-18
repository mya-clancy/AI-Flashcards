import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatTutor() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLecture() {
      if (!lectureId) return;
      const docRef = doc(db, 'lectures', lectureId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setLecture(snap.data());
        // Initial greeting
        setMessages([
          { sender: 'model', text: `Hi! I'm your AI tutor. Ask me anything about "${snap.data().title}".` }
        ]);
      } else {
        navigate('/');
      }
    }
    fetchLecture();
  }, [lectureId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !lecture) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          summaryContext: lecture.summary
        })
      });

      if (!response.ok) throw new Error('Chat API failed');
      const data = await response.json();

      setMessages(prev => [...prev, { sender: 'model', text: data.text }]);
    } catch (err: any) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  if (!lecture) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      <header className="flex items-center gap-4 py-4 mb-2 border-b border-white/10 shrink-0">
        <Link to={`/lecture/${lectureId}`} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-blue-400" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">AI Tutor</h1>
            <p className="text-xs text-blue-300">Discussing: {lecture.title}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-6 space-y-6 px-2 scrollbar-thin scrollbar-thumb-blue-500/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-[#162c4c] border border-white/10'}`}>
              {msg.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#162c4c] border border-white/10 text-gray-200 rounded-tl-none prose prose-invert'}`}>
              <p className="whitespace-pre-wrap leading-relaxed m-0">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[#162c4c] border border-white/10">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
            <div className="bg-[#162c4c] border border-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-4 pb-2">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask a question about the lecture..."
            className="w-full bg-[#162c4c] border border-white/10 rounded-2xl pl-6 pr-16 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors shadow-lg disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-xl text-white disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="w-5 h-5 ml-[-2px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
