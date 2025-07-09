
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';

export const useUserRole = () => {
  const { user } = useAppContext();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<number>(0);

  // Cache role check for 5 minutes to prevent excessive requests
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const now = Date.now();
      if (now - lastChecked < CACHE_DURATION && lastChecked > 0) {
        setIsLoading(false);
        return;
      }

      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000; // 1 second

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Checking user role (attempt ${attempt}/${MAX_RETRIES})`);
          
          const { data, error } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });

          if (error) {
            console.error(`Error checking user role (attempt ${attempt}):`, error);
            
            if (attempt === MAX_RETRIES) {
              // Log security event for monitoring
              console.warn('Failed to verify admin role after max retries:', {
                userId: user.id,
                error: error.message,
                timestamp: new Date().toISOString()
              });
              setIsAdmin(false);
            } else {
              // Wait before retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
              continue;
            }
          } else {
            setIsAdmin(data || false);
            setLastChecked(now);
            
            // Log successful admin verification for security audit
            if (data) {
              console.log('Admin role verified:', {
                userId: user.id,
                timestamp: new Date().toISOString()
              });
            }
          }
          break;
        } catch (error) {
          console.error(`Exception checking user role (attempt ${attempt}):`, error);
          
          if (attempt === MAX_RETRIES) {
            // Log security event
            console.warn('Exception verifying admin role:', {
              userId: user.id,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
            setIsAdmin(false);
          } else {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          }
        }
      }

      setIsLoading(false);
    };

    checkUserRole();
  }, [user, lastChecked]);

  // Force refresh role check (useful after role changes)
  const refreshRole = () => {
    setLastChecked(0);
    setIsLoading(true);
  };

  return { isAdmin, isLoading, refreshRole };
};
