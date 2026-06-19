async function getNetwork() {
    try {
        const response = await fetch('http://localhost:3001/api/network', { credentials: 'include' })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in getNetwork, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

async function getSegments() {
    try {
        const response = await fetch('http://localhost:3001/api/network/segments', { credentials: 'include' })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in getSegments, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

export { getNetwork, getSegments}