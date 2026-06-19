export async function doLogin(username, password) {
    const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    })

    if (response.ok) {
        const user = await response.json()
        return user
    } else {
        throw new Error("Login failed")
    }
}

export async function doLogout() {
    const response = await fetch('http://localhost:3001/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    })

    if (response.ok) return true
    throw new Error("Logout failed")
}

export async function checkSession() {
    const response = await fetch('http://localhost:3001/api/sessions/current', {
        credentials: "include"
    })
    if (response.ok) return await response.json()
    return null
}