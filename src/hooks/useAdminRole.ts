import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useAdminRole() {
  const [role, setRole] = useState<"admin" | "editor" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function getRole() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (active) {
          if (error || !data) {
            setRole(null);
          } else {
            setRole(data.role as "admin" | "editor");
          }
        }
      } catch (err) {
        if (active) setRole(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    getRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getRole();
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading };
}
