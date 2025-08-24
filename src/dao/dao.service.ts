import { Injectable, Logger } from '@nestjs/common';
import mongoose, { Model, Schema } from 'mongoose';
import { TaskStatus } from './dao.type';

// Define the interface for the Task document
export interface ITask extends mongoose.Document {
  taskId: string;
  command: string;
  logFilePath: string;
  comment: string;
  status: TaskStatus;
  results: any;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Mongoose schema corresponding to the ITask interface
const TaskSchema = new Schema<ITask>(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    command: { type: String, required: true },
    logFilePath: { type: String, required: true },
    comment: { type: String },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
    results: { type: Schema.Types.Mixed, default: {} },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  },
);

@Injectable()
export class DaoService {
  private readonly logger = new Logger(DaoService.name);
  private taskModel: Model<ITask>;

  constructor() {
    const URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const DB_NAME = process.env.MONGO_DB_NAME || 'mydatabase';
    const connectionString = `${URI}/${DB_NAME}`;

    this.logger.debug(`using MongoDB at ${connectionString}`);
    this.connectToMongo(connectionString);

    // Create the Mongoose model from the schema
    this.taskModel = mongoose.model<ITask>('Task', TaskSchema);
  }

  /**
   * Establishes connection to MongoDB.
   * @param connectionString - The MongoDB connection URI.
   */
  private async connectToMongo(connectionString: string) {
    try {
      await mongoose.connect(connectionString);
      this.logger.log('Successfully connected to MongoDB.');
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  /**
   * Creates a new task in the database.
   */
  async createTask(
    taskId: string,
    command: string,
    logFilePath: string,
    comment: string,
  ): Promise<void> {
    this.logger.log(
      `Creating task with ID: ${taskId}, command: ${command}, logFilePath: ${logFilePath}, comment: ${comment}`,
    );
    try {
      const newTask = new this.taskModel({
        taskId,
        command,
        logFilePath,
        comment,
        status: TaskStatus.PENDING, // Default status on creation
      });
      await newTask.save();
      this.logger.log(`Task ${taskId} created successfully.`);
    } catch (error) {
      this.logger.error(`Failed to create task ${taskId}`, error.stack);
      throw error;
    }
  }

  /**
   * Updates the status of an existing task.
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus = TaskStatus.IN_PROGRESS,
  ): Promise<void> {
    this.logger.log(`Updating task ID: ${taskId} to status: ${status}`);
    try {
      const result = await this.taskModel.findOneAndUpdate(
        { taskId },
        { $set: { status } },
        { new: true }, // Return the updated document
      );
      if (!result) {
        this.logger.warn(
          `Task with ID: ${taskId} not found for status update.`,
        );
      } else {
        this.logger.log(`Task ${taskId} status updated to ${status}.`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update status for task ${taskId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Fetches the status of a specific task.
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    this.logger.log(`Fetching status for task ID: ${taskId}`);
    try {
      const task = await this.taskModel.findOne({ taskId }).exec();
      if (task) {
        return task.status;
      }
      this.logger.warn(`Task with ID: ${taskId} not found.`);
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch status for task ${taskId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Submits and saves the results for a completed task.
   */
  async submitTaskResults(taskId: string, results: any): Promise<void> {
    this.logger.log(`Submitting results for task ID: ${taskId}`);
    try {
      const result = await this.taskModel.findOneAndUpdate(
        { taskId },
        {
          $set: {
            results,
            status: TaskStatus.COMPLETED, // Mark task as completed when results are submitted
          },
        },
        { new: true },
      );

      if (!result) {
        this.logger.warn(
          `Task with ID: ${taskId} not found for results submission.`,
        );
      } else {
        this.logger.log(`Results for task ${taskId} submitted successfully.`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to submit results for task ${taskId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Fetches the results of a specific task.
   */
  async getTaskResults(taskId: string): Promise<any> {
    this.logger.log(`Fetching results for task ID: ${taskId}`);
    try {
      const task = await this.taskModel.findOne({ taskId }).exec();
      if (task) {
        return task.results;
      }
      this.logger.warn(`Task with ID: ${taskId} not found.`);
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch results for task ${taskId}`,
        error.stack,
      );
      throw error;
    }
  }
}
