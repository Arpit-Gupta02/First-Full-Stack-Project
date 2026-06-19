"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for authentication state management
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * AUTHENTICATION GATEWAY
 * Interfaces with Supabase Auth to manage user lifecycle and JWT issuance.
 * Handles both account provisioning (SignUp) and session instantiation (SignIn).
 */
export default function LoginPage() {
  const router = useRouter();
  
  // Local state management for credential capture and UI status
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  /**
   * Executes the authentication mutation.
   * Branches logic based on current UI mode (Registration vs. Authorization).
   * Automatically persists the resulting JWT securely in local session storage via supabase-js.
   */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let authError;
      
      // Execute account provisioning protocol
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        authError = error;
      } 
      // Execute session instantiation protocol
      else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        authError = error;
      }

      if (authError) throw authError;
      
      alert(isSignUp ? "Account provisioned successfully." : "Authorization confirmed.");
      router.push("/"); // Redirect active session to the primary dashboard
    } catch (error: any) {
      alert(`Authentication fault: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center items-center font-sans">
      <div className="bg-white p-10 rounded-xl shadow-md w-full max-w-md border">
        <Link href="/" className="text-sm text-gray-500 hover:text-black mb-6 inline-block">← Back to Gallery</Link>
        <h2 className="text-3xl font-serif font-bold mb-6 text-[#0a192f]">
          {isSignUp ? "Initialize Account" : "Vault Authorization"}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-900">Email Directive</label>
            <input 
              type="email" required className="w-full border p-3 rounded bg-white text-gray-900 border-gray-400 focus:ring-2 focus:ring-[#0a192f] focus:outline-none" 
              onChange={(e) => setEmail(e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-900">Passphrase</label>
            <input 
              type="password" 
              required 
              className="w-full border p-3 rounded bg-white text-gray-900 border-gray-400 focus:ring-2 focus:ring-[#0a192f] focus:outline-none" 
              onChange={(e) => setPassword(e.target.value)}/>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#0a192f] text-white py-3 rounded font-bold hover:bg-gray-800 transition">
            {loading ? "Verifying Credentials..." : (isSignUp ? "Execute Registration" : "Authenticate")}
          </button>
        </form>
        
        <p className="mt-4 text-sm text-center text-gray-600">
          {isSignUp ? "Existing authorization? " : "Require access provisioning? "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-[#0a192f] hover:underline">
            {isSignUp ? "Login" : "Sign up"}
          </button>
        </p>
      </div>
    </main>
  );
}