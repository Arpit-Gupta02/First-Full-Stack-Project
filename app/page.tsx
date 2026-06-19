"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for component-level authentication checks
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Home() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<any>(null);

  // Hydrate user state on initial mount to determine UI rendering logic
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  /**
   * Fetches paginated slide data from the backend API.
   * Utilizes a temporal parameter to bypass internal caching layers and ensure fresh data hydration.
   */
  const fetchSlides = async (query = "", sort = "latest", currentPage = 1) => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const endpoint = `/api/slides?search=${query}&sort=${sort}&page=${currentPage}&t=${timestamp}`;
      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success) {
        setSlides(data.slides);
      }
    } catch (error) {
      console.error("Data fetching exception:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-trigger data fetch upon cursor (page) modification
  useEffect(() => {
    fetchSlides(searchQuery, sortBy, page);
  }, [page]);

  /**
   * Handles deletion mutations. Checks client-side session state before 
   * dispatching the secure DELETE request to the API.
   */
    const handleDelete = async (e: React.MouseEvent, id: string) => { e.preventDefault();
    if (!confirm("Permanently delete this case study?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Instantly remove the slide from the screen without waiting for the database
    setSlides((prevSlides) => prevSlides.filter((slide) => slide.id !== id));

    try {
      const res = await fetch(`/api/slides?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      
      const errorData = await res.json(); // Read the backend's response

      if (!res.ok) {
        fetchSlides(searchQuery, sortBy, page);
        // THIS WILL SHOW YOU THE EXACT CRASH REASON:
        alert(`Backend Error: ${errorData.message}`); 
      } else {
        alert("Successfully deleted!");
      }
    } catch (err) {
      fetchSlides(searchQuery, sortBy, page);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-serif font-bold">CaseVault</h1>
        <div className="flex items-center space-x-4">
          <input 
            type="text" 
            placeholder="Search presentations..." 
            className="border px-4 py-2 rounded text-sm w-64 focus:outline-none focus:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSlides(searchQuery, sortBy, 1)}
          />
          <button onClick={() => fetchSlides(searchQuery, sortBy, 1)} className="bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300">Search</button>
          <Link href="/methodology" className="text-sm font-medium text-gray-600 hover:text-black">Methodology</Link>
          
          {user ? (
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-800">Logout</button>
          ) : (
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
          )}

          <Link href="/upload" className="bg-[#0a192f] text-white px-5 py-2 text-sm font-medium rounded hover:bg-gray-800">↑ Upload</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 mt-12">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-serif mb-3">The Gallery</h2>
            <p className="text-gray-500">Curated excellence from top-tier competitions.</p>
          </div>
          <select className="font-bold cursor-pointer bg-transparent outline-none" onChange={(e) => { setSortBy(e.target.value); fetchSlides(searchQuery, e.target.value, 1); }}>
            <option value="latest">Latest Submissions</option>
            <option value="oldest">Oldest Submissions</option>
            <option value="az">Alphabetical (A-Z)</option>
          </select>
        </div>

        {loading ? (<div className="text-center py-10 text-gray-500">Loading Vault...</div>) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {slides.map((slide, index) => (
                <div key={slide.id || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <a href={slide.file_url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer flex-grow">
                    <img src={slide.thumbnail_url} className="w-full h-56 object-cover" alt={slide.title} />
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#0a192f] bg-gray-100 px-2 py-1 rounded">{slide.category}</span>
                        {slide.tags && <span className="text-[10px] font-medium text-gray-500 truncate max-w-[100px]">{slide.tags}</span>}
                      </div>
                      <h3 className="text-xl font-bold font-serif mb-2">{slide.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{slide.description}</p>
                      <div className="mt-4 text-[#0a192f] font-bold text-xs uppercase underline">View Document</div>
                    </div>
                  </a>
                  
                  {/* Conditional rendering of mutation controls based on resource ownership */}
                  {user && user.id === slide.user_id && (
                    <div className="bg-gray-50 px-6 py-3 border-t text-right">
                      <button onClick={(e) => handleDelete(e, slide.id)} className="text-xs font-bold text-red-500 hover:underline">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center items-center space-x-6 border-t pt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-4 py-2 rounded text-sm font-bold ${page === 1 ? 'text-gray-300' : 'text-[#0a192f] bg-gray-100 hover:bg-gray-200'}`}>
                ← Previous
              </button>
              <span className="text-sm font-bold text-gray-500">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={slides.length < 6} className={`px-4 py-2 rounded text-sm font-bold ${slides.length < 6 ? 'text-gray-300' : 'text-[#0a192f] bg-gray-100 hover:bg-gray-200'}`}>
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}