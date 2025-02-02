import { TaskEntity } from "../../infrastructure/database/model-repository/task.model";
import { UpdateTaskRequestDto } from "../domain/dtos/task.dto";

export const taskValidation = {
    async checkExistedTaskByTaskId(taskId: string): Promise<boolean> {
        try {
            const existedTask = await TaskEntity.findOne({ _id: taskId }) != null
            return existedTask;
        } catch (error: any) {
            console.log(error.message.toString());
            return false;
        }
    },

    async checkExistedTaskByTitle(title: string): Promise<boolean> {
        try {
            const existedTask = await TaskEntity.findOne({ title: title }) != null
            return existedTask;
        } catch (error: any) {
            console.log(error.message.toString());
            return false;
        }
    },

    async checkExistedTaskInGroupTask(taskId: string, groupTaskId: string): Promise<boolean> {
        try {
            const existedTask = await TaskEntity.findOne({ _id: groupTaskId, tasks: taskId });
            return existedTask != null;
        } catch (error: any) {
            console.log(error.message.toString());
            return false;
        }
    },

    async compareTaskId(taskIdUrl: string, taskIdBody: string): Promise<boolean> {
        try {
            return taskIdUrl === taskIdBody;
        } catch (error: any) {
            console.log(error.message.toString());
            return false;
        }
    }
}