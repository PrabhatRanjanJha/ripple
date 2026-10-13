import mongoose from 'mongoose'

const scenarioSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60,
        },
        changes: {
            type: [
                {
                    _id: false,
                    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
                    deltaDays: { type: Number, required: true },
                },
            ],
            default: [],
        },
    },
    { timestamps: true, versionKey: false }
)

const Scenario = mongoose.model('Scenario', scenarioSchema)

export default Scenario