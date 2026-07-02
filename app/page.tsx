import { supabase } from '../lib/supabase';
import DashboardClient from './DashboardClient';

interface ProcurementItem {
  id: number;
  category: string;
  procuring_agency: string;
  procurement_method: string;
  award_date: string;
  company_name: string;
  company_dzongkhag: string;
  value_million_nu: number | string;
}

export const revalidate = 0; // Set to 0 for live telemetry updates on refresh

export default async function Home() {
  // Fetch dataset from Supabase safely on the server side
  const { data: procurements } = await supabase
    .from('procurements')
    .select('*')
    .order('award_date', { ascending: false });

  const dataList: ProcurementItem[] = procurements || [];

  return <DashboardClient initialData={dataList} />;
}