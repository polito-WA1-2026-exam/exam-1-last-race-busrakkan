import { BASE_URL } from './config.js'

async function getNetwork() {
    try {
        const response = await fetch(`${BASE_URL}/network`, { credentials: 'include' })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in getNetwork, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

async function getSegments() {
    try {
        const response = await fetch(`${BASE_URL}/network/segments`, { credentials: 'include' })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in getSegments, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

async function createGame() {
    try {
        const response = await fetch(`${BASE_URL}/games`, {
            method: 'POST',
            credentials: 'include'
        })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in createGame, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

async function startPlanning(gameId) {
    try {
        const response = await fetch(`${BASE_URL}/games/${gameId}/start`, {
            method: 'POST',
            credentials: 'include'
        })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in startPlanning, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

async function submitRoute(gameId, segmentIds) {
    try {
        const response = await fetch(`${BASE_URL}/games/${gameId}/route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ segmentIds })
        })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in submitRoute, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

async function getRanking() {
    try {
        const response = await fetch(`${BASE_URL}/ranking`, { credentials: 'include' })
        if (response.ok) return await response.json()
        throw new Error('HTTP error in getRanking, code=' + response.status)
    } catch (ex) {
        throw new Error("Network error", { cause: ex })
    }
}

export { getNetwork, getSegments, createGame, startPlanning, submitRoute, getRanking }