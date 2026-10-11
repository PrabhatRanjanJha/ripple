const findCycle = (tasks) => {
    const dependenciesOf = new Map()
    tasks.forEach((task) => {
        dependenciesOf.set(task.id, task.dependsOn || [])
    })

    const state = new Map()
    const path = []

    const visit = (id) => {
        state.set(id, 1)
        path.push(id)

        for (const next of dependenciesOf.get(id)) {
            if (!dependenciesOf.has(next)) {
                continue
            }

            if (state.get(next) === 1) {
                return path.slice(path.indexOf(next))
            }

            if (!state.has(next)) {
                const cycle = visit(next)
                if (cycle) {
                    return cycle
                }
            }
        }

        path.pop()
        state.set(id, 2)
        return null
    }

    for (const task of tasks) {
        if (!state.has(task.id)) {
            const cycle = visit(task.id)
            if (cycle) {
                return cycle
            }
        }
    }

    return null
}

const topoSort = (tasks) => {
    const ids = new Set(tasks.map((task) => task.id))
    const waitingFor = new Map()
    const dependents = new Map()

    tasks.forEach((task) => {
        const dependencies = [...new Set((task.dependsOn || []).filter((id) => ids.has(id)))]
        waitingFor.set(task.id, dependencies.length)

        dependencies.forEach((id) => {
            if (!dependents.has(id)) {
                dependents.set(id, [])
            }
            dependents.get(id).push(task.id)
        })
    })

    const queue = tasks.filter((task) => waitingFor.get(task.id) === 0).map((task) => task.id)
    const order = []

    while (queue.length > 0) {
        const id = queue.shift()
        order.push(id)

        for (const next of dependents.get(id) || []) {
            waitingFor.set(next, waitingFor.get(next) - 1)
            if (waitingFor.get(next) === 0) {
                queue.push(next)
            }
        }
    }

    if (order.length !== tasks.length) {
        const error = new Error('Circular dependency found')
        error.cycle = findCycle(tasks)
        throw error
    }

    return order
}

export { findCycle, topoSort }