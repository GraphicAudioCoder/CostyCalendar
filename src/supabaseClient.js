import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://huozynweugrmuecxrsyt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1b3p5bndldWdybXVlY3hyc3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTk2NjQsImV4cCI6MjA3MTIzNTY2NH0.6V9X_of9YDYw2u9g8MWAMFDdTGWtd1Eb67rWBE98PqM'
export const supabase = createClient(supabaseUrl, supabaseKey)
    