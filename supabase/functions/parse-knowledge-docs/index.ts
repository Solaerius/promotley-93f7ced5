import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // List files recursively in the knowledge bucket
    const bucketName = 'promotley_knowledgebase';
    
    // Recursive function to list all files in all folders
    async function listAllFiles(path: string = ''): Promise<{ name: string; fullPath: string }[]> {
      const allFiles: { name: string; fullPath: string }[] = [];
      
      const { data: items, error } = await supabase.storage
        .from(bucketName)
        .list(path, { limit: 200 });
      
      if (error) {
        console.error(`Error listing path ${path}:`, error);
        return allFiles;
      }
      
      for (const item of items || []) {
        if (!item.name) continue;
        
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        // Check if it's a folder (no metadata means it's a folder)
        if (item.metadata === null && !item.name.includes('.')) {
          // It's a folder, recurse into it
          console.log(`📁 Found folder: ${fullPath}`);
          const subFiles = await listAllFiles(fullPath);
          allFiles.push(...subFiles);
        } else {
          // It's a file
          allFiles.push({ name: item.name, fullPath });
        }
      }
      
      return allFiles;
    }
    
    console.log('🔍 Starting recursive file scan...');
    const allFiles = await listAllFiles();
    console.log(`📄 Found ${allFiles.length} files total`);

    const results: { file: string; status: string; category?: string }[] = [];

    for (const file of allFiles) {
      const fileName = file.name.toLowerCase();
      
      // Skip non-text files we can't easily parse
      const isTextFile = fileName.endsWith('.txt') || fileName.endsWith('.md');
      const isPdf = fileName.endsWith('.pdf');
      
      if (!isTextFile && !isPdf) {
        results.push({ file: file.fullPath, status: 'skipped - unsupported format' });
        continue;
      }

      try {
        console.log(`📥 Downloading: ${file.fullPath}`);
        
        // Download the file using full path
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucketName)
          .download(file.fullPath);

        if (downloadError || !fileData) {
          results.push({ file: file.fullPath, status: `error - ${downloadError?.message || 'download failed'}` });
          continue;
        }

        let content = '';
        
        if (isTextFile) {
          // Text files can be read directly
          content = await fileData.text();
        } else if (isPdf) {
          // For PDFs, we extract basic text content
          const arrayBuffer = await fileData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          content = extractTextFromPdf(bytes);
          
          if (!content || content.length < 50) {
            results.push({ file: file.fullPath, status: 'warning - PDF may be image-based or encrypted, minimal text extracted' });
          }
        }

        if (!content || content.trim().length === 0) {
          results.push({ file: file.fullPath, status: 'skipped - no content extracted' });
          continue;
        }

        // Determine category from full path (includes folder names)
        const category = determineCategory(file.fullPath);
        // Use full path for title to make it unique
        const title = file.fullPath.replace(/\.(pdf|txt|md)$/i, '').replace(/_/g, ' ').replace(/\//g, ' - ');

        // Check if entry already exists
        const { data: existing } = await supabase
          .from('ai_knowledge')
          .select('id')
          .eq('title', title)
          .maybeSingle();

        if (existing) {
          // Update existing entry
          const { error: updateError } = await supabase
            .from('ai_knowledge')
            .update({ 
              content: content.substring(0, 50000),
              category,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) {
            results.push({ file: file.fullPath, status: `error - ${updateError.message}` });
          } else {
            results.push({ file: file.fullPath, status: 'updated', category });
          }
        } else {
          // Insert new entry
          const { error: insertError } = await supabase
            .from('ai_knowledge')
            .insert({
              title,
              content: content.substring(0, 50000),
              category
            });

          if (insertError) {
            results.push({ file: file.fullPath, status: `error - ${insertError.message}` });
          } else {
            results.push({ file: file.fullPath, status: 'imported', category });
          }
        }
      } catch (fileError: unknown) {
        console.error(`Error processing ${file.fullPath}:`, fileError);
        const errMsg = fileError instanceof Error ? fileError.message : 'Unknown error';
        results.push({ file: file.fullPath, status: `error - ${errMsg}` });
      }
    }

    const imported = results.filter(r => r.status === 'imported').length;
    const updated = results.filter(r => r.status === 'updated').length;
    const errors = results.filter(r => r.status.startsWith('error')).length;

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total: allFiles.length,
        imported,
        updated,
        errors,
        skipped: results.filter(r => r.status.startsWith('skipped')).length
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Parse knowledge docs error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function determineCategory(filename: string): string {
  const lower = filename.toLowerCase();
  
  if (lower.includes('regler') || lower.includes('rules')) return 'uf_rules';
  if (lower.includes('tavling') || lower.includes('competition')) return 'competition_criteria';
  if (lower.includes('arsredovisning') || lower.includes('annual')) return 'annual_report';
  if (lower.includes('affarsplan') || lower.includes('business')) return 'business_plan';
  if (lower.includes('pitch')) return 'pitch_guide';
  if (lower.includes('marknadsforing') || lower.includes('marketing')) return 'marketing_tips';
  if (lower.includes('social') || lower.includes('media')) return 'social_media';
  
  return 'general';
}

function extractTextFromPdf(bytes: Uint8Array): string {
  // Simple PDF text extraction
  // This handles basic text streams in PDFs
  // For complex PDFs with images/fonts, a full library would be needed
  
  const text: string[] = [];
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(bytes);
  
  // Find text between stream and endstream
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  let match;
  
  while ((match = streamRegex.exec(content)) !== null) {
    const streamContent = match[1];
    
    // Try to extract readable text
    // Handle text showing operators: Tj, TJ, '
    const textRegex = /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g;
    let textMatch;
    
    while ((textMatch = textRegex.exec(streamContent)) !== null) {
      const extracted = textMatch[1] || textMatch[2];
      if (extracted) {
        // Clean up the text
        const cleaned = extracted
          .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        
        if (cleaned.trim()) {
          text.push(cleaned);
        }
      }
    }
  }
  
  // Also try to find raw text patterns
  const plainTextRegex = /BT\s*([\s\S]*?)\s*ET/g;
  while ((match = plainTextRegex.exec(content)) !== null) {
    const btContent = match[1];
    const innerTextRegex = /\(([^)]+)\)/g;
    let innerMatch;
    while ((innerMatch = innerTextRegex.exec(btContent)) !== null) {
      if (innerMatch[1] && innerMatch[1].length > 2) {
        text.push(innerMatch[1]);
      }
    }
  }
  
  return text.join(' ').replace(/\s+/g, ' ').trim();
}
