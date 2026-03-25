import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Report } from "../types";

export function useReports(filters?: { type?: string; competition?: string; search?: string }) {
  return useQuery({
    queryKey: ["reports", filters],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.type) query = query.eq("type", filters.type);
      if (filters?.competition) query = query.eq("competition", filters.competition);
      if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as Report[];
    },
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Omit<Report, "id" | "created_at">) => {
      const { data, error } = await supabase.from("reports").insert(report).select().single();
      if (error) throw error;
      return data as Report;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
