"use client";
import Link from "next/link";

/**
 * METHODOLOGY PAGE
 * Documents the frameworks used to analyze the cases archived in this vault.
 */
export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-16">
      {/* NAVIGATION */}
      <nav className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm">
        <Link href="/" className="text-2xl font-serif font-bold tracking-tight">CaseVault</Link>
        <div className="text-sm font-medium space-x-6">
          <Link href="/" className="hover:text-blue-600 transition">The Gallery</Link>
          <Link href="/upload" className="bg-[#0a192f] text-white px-4 py-2 rounded hover:bg-gray-800 transition">↑ Upload</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 mt-16">
        <h1 className="text-5xl font-serif font-bold mb-8 text-[#0a192f]">Analytical Methodology</h1>
        
        <div className="prose prose-lg text-gray-700 leading-relaxed space-y-6">
          <p>
            At CaseVault, we believe that strategic excellence is built upon structured analytical frameworks. 
            Every presentation archived within this repository has been evaluated using standard 
            academic and professional rigor.
          </p>

          <h3 className="text-2xl font-bold mt-10 mb-4 text-gray-900">Our Core Frameworks</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>SWOT Analysis:</strong> Evaluating Strengths, Weaknesses, Opportunities, and Threats for internal/external alignment.</li>
            <li><strong>Porter's Five Forces:</strong> Assessing the competitive intensity and attractiveness of a market.</li>
            <li><strong>PESTLE:</strong> Analyzing macro-environmental factors affecting business strategy.</li>
            <li><strong>Financial Viability:</strong> Reviewing revenue projections, NPV, and IRR analysis for feasibility.</li>
          </ul>

          <h3 className="text-2xl font-bold mt-10 mb-4 text-gray-900">Submission Standards</h3>
          <p>
            To ensure the quality of the vault, every uploaded case study must include a detailed executive 
            summary, a clear problem statement, and a data-driven justification for the proposed strategic 
            recommendations.
          </p>
        </div>
      </div>
    </main>
  );
}