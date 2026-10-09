import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
