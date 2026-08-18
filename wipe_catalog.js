import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient('https://vsxulsxykkwrmgscbehu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeHVsc3h5a2t3cm1nc2NiZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDExNTQsImV4cCI6MjEwMTU3NzE1NH0.GYwn-uVSb1rV8r8iv7f8OROaERwrsK4Fbl7jql7MoQU'); 
supabase.from('spare_parts_catalog').delete().neq('id', 0).then(() => console.log('Deleted catalog')).catch(console.error);
