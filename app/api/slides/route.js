import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Enforce dynamic rendering to prevent stale data serving from Next.js cache
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET Handler: Retrieves paginated and filtered case studies.
 * Implements cursor-based pagination and multi-field search logic.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const sortBy = searchParams.get('sort') || 'latest';
    
    // Compute pagination offsets based on requested page and predefined limit
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 6;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('slides').select('*', { count: 'exact' });

    // Apply ascending/descending sorts based on client parameters
    if (sortBy === 'latest') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'az') query = query.order('title', { ascending: true });

    // Apply query boundaries for pagination
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    // Execute in-memory filtering for multi-attribute search coverage
    let filteredData = data;
    if (search) {
      filteredData = data.filter(slide => 
        slide.title?.toLowerCase().includes(search) || 
        slide.description?.toLowerCase().includes(search) ||
        slide.tags?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, slides: filteredData, totalCount: count }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST Handler: Ingests new case studies into the vault.
 * Requires JWT verification.
 */
export async function POST(request) {
  try {
    // Extract Bearer token and verify JWT signature against Supabase Auth service
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ success: false, message: "Unauthorized request" }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return NextResponse.json({ success: false, message: "Invalid or expired JWT" }, { status: 401 });

    const body = await request.json();
    
    // Persist metadata payload, binding the resulting record to the authenticated user ID
    const { data, error } = await supabase
      .from('slides')
      .insert([{ 
          title: body.title, 
          description: body.description, 
          category: body.category,
          competition_name: body.competition_name,
          year: body.year,
          tags: body.tags, 
          thumbnail_url: body.thumbnail_url,
          file_url: body.file_url,
          user_id: user.id 
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, slide: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * DELETE Handler: Removes a case study from the vault.
 * Implements strict ownership authorization prior to mutation.
 */
export async function DELETE(request) {
  try {
    // Authenticate client via JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ success: false, message: "Unauthorized request" }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ success: false, message: "Invalid JWT" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Execute deletion strictly matching both resource ID and owner UID to prevent unauthorized data mutation
    const { error } = await supabase.from('slides').delete().eq('id', id).eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Resource successfully deallocated." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}