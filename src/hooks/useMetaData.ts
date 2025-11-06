import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InstagramData {
  username?: string;
  name?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  error?: string;
}

interface FacebookData {
  name?: string;
  followers_count?: number;
  page_id?: string;
  user_id?: string;
  error?: string;
}

interface MetaData {
  instagram: InstagramData | null;
  facebook: FacebookData | null;
}

export const useMetaData = () => {
  const [data, setData] = useState<MetaData>({
    instagram: null,
    facebook: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchMetaData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching Meta data...');
      const { data: metaData, error: fetchError } = await supabase.functions.invoke(
        'fetch-meta-data',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch Meta data');
      }

      // Check if the response indicates failure
      if (metaData && !metaData.success) {
        throw new Error(metaData.error || 'Failed to fetch Meta data');
      }

      console.log('Meta data fetched successfully:', metaData);
      setData({
        instagram: metaData.instagram,
        facebook: metaData.facebook,
      });

    } catch (err) {
      const error = err as Error;
      console.error('Error fetching Meta data:', error);
      setError(error);
      
      // Only show toast if it's not a "no connections" error
      if (!error.message.includes('No Instagram or Facebook connections')) {
        toast({
          title: 'Kunde inte hämta Meta-data',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaData();
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch: fetchMetaData,
  };
};
