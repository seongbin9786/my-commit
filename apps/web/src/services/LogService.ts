const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function saveLogToServer(date: string, content: string) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/raw-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ date, content }),
    });
    if (!response.ok) {
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        console.error('Failed to save log to server:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to save log to server:', error);
  }
}

export async function getLogFromServer(date: string): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/raw-logs/${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
        if (response.status === 401) {
             localStorage.removeItem('token');
        }
      return null;
    }
    const data = await response.json();
    return data.content || '';
  } catch (error) {
    console.error('Failed to fetch log from server:', error);
    return null;
  }
}

export async function login(username: string, password: string): Promise<{ access_token: string } | null> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        throw new Error('Login failed');
    }
    return response.json();
}

export async function signup(username: string, password: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        throw new Error('Signup failed');
    }
}
