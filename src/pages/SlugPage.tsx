import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import NotFound from './NotFound';

export default function SlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      try {
        const q = query(collection(db, 'custom_pages'), where('path', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setHtmlContent(querySnapshot.docs[0].data().htmlContent);
        } else {
          setHtmlContent(null);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // If a custom HTML page was found in Firebase, render it directly
  if (htmlContent) {
    return (
      <div 
        className="w-full min-h-screen bg-white text-black" 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    );
  }

  // Fallback UI if no page is found for this slug
  return <NotFound />;
}
