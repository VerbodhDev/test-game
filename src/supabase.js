import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key missing! Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })
    return { data, error }
}

export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    return { data, error }
}

export const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
}

export const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// High Score helpers
export const saveHighScore = async (score) => {
    const user = await getUser()
    if (!user) return { error: 'User not logged in' }

    const { data, error } = await supabase
        .from('high_scores')
        .insert([
            { user_id: user.id, score, username: user.email.split('@')[0] }
        ])
        .select()

    return { data, error }
}

export const getHighScores = async (limit = 10) => {
    const { data, error } = await supabase
        .from('high_scores')
        .select('username, score, created_at')
        .order('score', { ascending: false })
        .limit(limit)

    return { data, error }
}
