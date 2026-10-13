const checkChanges = (changes, validTaskIds) => {
    if (!Array.isArray(changes) || changes.length > 50) {
        return { error: 'Changes must be a list of up to 50 items' }
    }

    const cleaned = []
    for (const change of changes) {
        if (!change || typeof change !== 'object' || typeof change.taskId !== 'string' || !Number.isInteger(change.deltaDays)) {
            return { error: 'Each change needs a task id and a whole number of days' }
        }

        if (change.deltaDays < -364 || change.deltaDays > 364) {
            return { error: 'Each change must be between -364 and 364 days' }
        }

        if (!validTaskIds.includes(change.taskId)) {
            return { error: 'Changes can only use tasks from this project' }
        }

        cleaned.push({ taskId: change.taskId, deltaDays: change.deltaDays })
    }

    return { changes: cleaned }
}

export { checkChanges }