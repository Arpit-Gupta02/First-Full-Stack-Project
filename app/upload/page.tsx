"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function UploadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  // Isolate binary file state from metadata payload
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({ 
    title: "", 
    competition_name: "",
    year: "2024",
    category: "Strategy",
    tags: "", 
    description: "", 
  });

  // Strict route protection: Redirection triggered if active session is undefined
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert("Authentication required. Please login.");
        router.push("/login");
      } else {
        setSession(session);
      }
    });
  }, [router]);

  /**
   * Orchestrates multi-part data submission.
   * 1. Uploads binary assets to respective Supabase Storage buckets.
   * 2. Retrieves public URIs for the uploaded assets.
   * 3. Transmits composite metadata payload (including URIs) to the backend API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thumbnailFile || !docFile) return alert("Please ensure both Case Materials and Thumbnail are attached.");
    if (!session) return alert("Session expired.");

    setIsSubmitting(true);
    
    try {
      // Execute storage uploads utilizing timestamp-appended filenames to prevent collision
      const thumbExt = thumbnailFile.name.split('.').pop();
      const thumbName = `thumb_${Date.now()}.${thumbExt}`;
      const { error: thumbError } = await supabase.storage.from('thumbnails').upload(thumbName, thumbnailFile);
      if (thumbError) throw thumbError;
      const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbName);

      const docExt = docFile.name.split('.').pop();
      const docName = `doc_${Date.now()}.${docExt}`;
      const { error: docError } = await supabase.storage.from('materials').upload(docName, docFile);
      if (docError) throw docError;
      const { data: docUrlData } = supabase.storage.from('materials').getPublicUrl(docName);

      // Transmit payload with injected JWT authorization header
      const res = await fetch("/api/slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          ...formData,
          thumbnail_url: thumbUrlData.publicUrl,
          file_url: docUrlData.publicUrl 
        }),
      });

      if (res.ok) {
        alert("Case Study successfully published to the Vault!");
        router.push("/"); 
      } else {
        const errorData = await res.json();
        alert(`Database Error: ${errorData.message}`);
      }
    } catch (error: any) {
      alert(error.message || "A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Block client-side rendering until session state is fully resolved
  if (!session) return <div className="p-10 text-center font-bold mt-20">Verifying Vault Access...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">
      <nav className="bg-[#0a192f] text-white px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-serif font-bold tracking-tight hover:opacity-80 transition">
          CaseVault
        </Link>
        <div className="text-sm space-x-6">
          <Link href="/" className="hover:text-gray-300 cursor-pointer">The Gallery</Link>
          <Link href="/methodology" className="hover:text-gray-300">Methodology</Link>
        </div>
      </nav>

      <div className="flex-grow flex justify-center p-10">
        <div className="bg-white p-12 rounded shadow-sm border w-full max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-serif font-bold mb-3 text-[#0a192f]">Curate Your Work</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Submit your strategic analysis to the executive vault. Ensure your materials meet our standards for academic rigor and professional presentation.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Case Materials</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition group">
                <input 
                  type="file" accept=".pdf,.pptx,.key" required
                  onChange={(e) => e.target.files && setDocFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <svg className="w-8 h-8 text-gray-400 mb-3 group-hover:text-[#0a192f] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                {docFile ? (
                  <p className="text-[#0a192f] font-bold text-center">Attached: {docFile.name}</p>
                ) : (
                  <>
                    <p className="text-gray-700 font-medium">Drag and drop slides here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse (.pdf, .pptx, .key)</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preview Thumbnail</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 bg-gray-100 border rounded flex items-center justify-center overflow-hidden">
                  {thumbnailFile ? (
                    <span className="text-xs text-center p-1 font-medium text-[#0a192f] line-clamp-2">{thumbnailFile.name}</span>
                  ) : (
                    <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="file" accept="image/*" required
                    onChange={(e) => e.target.files && setThumbnailFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <button type="button" className="border px-4 py-1.5 text-sm rounded bg-white hover:bg-gray-50 transition">Choose File</button>
                  <p className="text-xs text-gray-400 mt-1">Optimal ratio 16:9. Max size 5MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Case Title</label>
              <input required type="text" placeholder="Enter a prestigious title..." className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#0a192f] transition" onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Competition Name</label>
                <input required type="text" placeholder="e.g., Global Strategy Case 2024" className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#0a192f] transition" onChange={(e) => setFormData({...formData, competition_name: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Year</label>
                <select className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#0a192f] transition bg-white" onChange={(e) => setFormData({...formData, year: e.target.value})}>
                  <option>2026</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <select className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#0a192f] transition bg-white" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option>Strategy</option><option>Finance</option><option>Marketing</option><option>Social Impact</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
                <input required type="text" placeholder="e.g. B2B, AI, M&A" className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#0a192f] transition" onChange={(e) => setFormData({...formData, tags: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Executive Summary</label>
              <textarea required rows={4} placeholder="Provide a concise summary..." className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#0a192f] transition resize-none" onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
            </div>

            <div className="flex justify-end items-center pt-4 border-t mt-8 gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-black transition">Cancel</Link>
              <button type="submit" disabled={isSubmitting} className={`bg-[#0a192f] text-white text-sm font-medium px-8 py-3 rounded hover:bg-gray-800 transition ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'Uploading to Vault...' : 'Publish to Vault'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}