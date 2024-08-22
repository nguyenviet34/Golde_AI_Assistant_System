import { IGroupTaskEntity } from "../../infrastructure/database/entities/group-task.entity";
import { TaskEntity } from "../../infrastructure/database/entities/task.entity";
import { IResponse } from "../common/response";
import { msg200, msg400 } from "../common/response-helpers";
import { ARCHIVE_GROUP_TASK_FAILED, CREATE_GROUP_TASK_FAILED, ENABLE_GROUP_TASK_FAILED, EXCEPTION_PREFIX, GROUP_TASK_EXCEPTION, GROUP_TASK_NOT_FOUND, PROJECT_NOT_FOUND } from "../domain/constants/error.constant";
import { BooleanStatus } from "../domain/enums/enums";
import { groupTaskStore } from "../store/group-task.store";
import { projectStore } from "../store/project.store";
import { groupTaskValidation } from "../validations/group-task.validation";
import { projectService } from "./project.service";
import { taskService } from "./task.service";

const projectServiceImpl = projectService;
const groupTaskValidationImpl = groupTaskValidation;

class GroupTaskService {
    constructor() { }

    async createGroupTaskToProject(groupTask: any, projectId: string): Promise<IResponse> {
        try {
            groupTask = await this.checkDefaultGroupTask(groupTask);

            const createGroupTask = await groupTaskStore.createGroupTask(groupTask);
            const groupTaskId = (createGroupTask as any)._id;

            if (await groupTaskValidationImpl.checkExistedGroupTaskInProject(groupTaskId, projectId) === false) { // not exist
                projectServiceImpl.updateProject(projectId, { $push: { groupTasks: groupTaskId } });
                return msg200({
                    message: (createGroupTask as any)
                });
            } else {
                await groupTaskStore.deleteGroupTask(groupTaskId);
                return msg400(CREATE_GROUP_TASK_FAILED);
            }
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    async checkDefaultGroupTask(groupTask: any): Promise<IGroupTaskEntity> {
        const defaultGroupTask = await groupTaskStore.checkDefaultGroupTask(groupTask.projectId);
        if (defaultGroupTask.length === 0 || defaultGroupTask === null) {
            console.log("Project does not have default group task");
            groupTask.isDefault = BooleanStatus.true;
            return groupTask;
        }
        return groupTask;
    } 

    // This fucntion does not response to client
    async createGroupTaskFromTask(groupTask: any, projectId: string): Promise<string | undefined> {
        try {
            groupTask = await this.checkDefaultGroupTask(groupTask);

            const createGroupTask = await groupTaskStore.createGroupTask(groupTask); 
            const groupTaskId = (createGroupTask as any)._id;

            if (await groupTaskValidationImpl.checkExistedGroupTaskInProject(groupTaskId, projectId) === false) { // not exist
                projectServiceImpl.updateProject(projectId, { $push: { groupTasks: groupTaskId } });
                return groupTaskId;
            } else {
                return undefined;
            }
        } catch (error: any) {
            console.log(error.message.toString());
            return undefined;
        }
    }

    async updateGroupTask(groupTaskId: string, groupTask: any): Promise<IResponse> {
        try {
            if (await groupTaskValidationImpl.checkExistedGroupTaskById(groupTaskId) === true) {

                const updateGroupTask = await groupTaskStore.updateGroupTask(groupTaskId, groupTask); 

                return msg200({
                    message: (updateGroupTask as any)
                });
            } else {
                return msg400(GROUP_TASK_NOT_FOUND);
            }
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    async deleteGroupTask(groupTaskId: string, projectId: string): Promise<IResponse> {
        try {
            if (await groupTaskValidationImpl.checkExistedGroupTaskById(groupTaskId) === true) {
                // delete all tasks in group task
                const tasks = await groupTaskStore.findGroupTaskWithTasks(groupTaskId);
                if (tasks !== null) {
                    for (let i = 0; i < tasks.tasks.length; i++) {
                        await taskService.deleteTask(tasks.tasks[i], groupTaskId);
                    }
                }
                const deleteGroupTask = await groupTaskStore.deleteGroupTask(groupTaskId);
                await projectStore.pullGrouptaskFromProject(projectId, groupTaskId);

                return msg200({
                    message: (deleteGroupTask as any)
                });
            } else {
                return msg400('Group task not found');
            }
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    async getGroupTask(groupTaskId: string): Promise<IResponse> {
        const groupTask = await groupTaskStore.findGroupTaskById(groupTaskId);

        return msg200({
            groupTask
        });
    }
    
    async getGroupTaskByTaskId(taskId: string): Promise<string> {
        try {
            const groupTask = await groupTaskStore.findGroupTasksByTaskId(taskId);
            if (groupTask === null || groupTask === undefined) {
                return GROUP_TASK_NOT_FOUND;
            } else {
                return groupTask._id;
            }
        } catch (err: any) {
            console.log(err.message.toString());
            return EXCEPTION_PREFIX + GROUP_TASK_EXCEPTION;
        }
    }

    async getTasksInGroupTaskByTimestamp(groupTaskId: string, startDate: string, endDate: string): Promise<IResponse> {
        const startDateTimeStamp = new Date(startDate);
        const endDateTimeStamp = new Date(endDate);
        const getTasksInGroupTask = await groupTaskStore.findTasksInGrouptaskByTimeStamp(groupTaskId, startDateTimeStamp, endDateTimeStamp);
        const getTasks = getTasksInGroupTask?.tasks;

        return msg200({
            message: (getTasks as any)
        });
    }

    async updateManyTasksInGroupTask(taskId: string): Promise<IResponse> {
        const updateManyGroupTasks = await groupTaskStore.pullTaskFromGroupTask(taskId);

        return msg200({
            message: (updateManyGroupTasks as any)
        });
    }

    async updateGroupTaskName(groupTaskId: string, name: string): Promise<IResponse> {
        try {
            if (await groupTaskValidationImpl.checkExistedGroupTaskById(groupTaskId) === true) {
                const groupTask = await groupTaskStore.findGroupTaskById(groupTaskId);
                if (groupTask === null) {
                    return msg400(GROUP_TASK_NOT_FOUND);
                } else {
                    groupTask.title = name;
                    await groupTaskStore.updateGroupTask(groupTaskId, groupTask);
                    return msg200({
                        message: 'Group task name updated successfully'
                    });
                }
            }
            return msg400(GROUP_TASK_NOT_FOUND);
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    // calculate totalTasks, completedTasks
    async calculateCompletedTasks(groupTaskId: string): Promise<IResponse> {
        try {
            if (await groupTaskValidationImpl.checkExistedGroupTaskById(groupTaskId) === true) {
                const groupTask = await groupTaskStore.findGroupTaskById(groupTaskId);
                if (groupTask === null) {
                    return msg400(GROUP_TASK_NOT_FOUND);
                } else {
                    const totalTasks = groupTask.tasks.length;
                    let completedTasks = 0;
                    for (let i = 0; i < groupTask.tasks.length; i++) {
                        const taskId = groupTask.tasks[i];
                        const task = await TaskEntity.findOne({ _id: taskId });
                        // const task = await taskStore.findTaskById(taskId);
                        if (task !== null) {
                            if (task.status === 'DONE') {
                                completedTasks++;
                            }
                        } else {
                            continue;
                        }
                    }
                    groupTask.totalTasks = totalTasks;
                    groupTask.completedTasks = completedTasks;
                    await groupTaskStore.updateGroupTask(groupTaskId, groupTask);
                    return msg200({
                        groupTask,
                    });
                }
            }
            return msg400(GROUP_TASK_NOT_FOUND);
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    async updateOrdinalNumber(projectId: string, groupTaskId: string): Promise<IResponse> {
        try {
            if (await groupTaskValidationImpl.checkExistedGroupTaskById(groupTaskId) === true) {
                const project = await projectStore.findOneProjectById(projectId);
                if (project === null) {
                    return msg400(PROJECT_NOT_FOUND);
                } else {
                    const groupTasks = project.groupTasks;
                    const groupTaskIndex = groupTasks.indexOf(groupTaskId);
                    if (groupTaskIndex > -1) {
                        // Remove the group task from its current position
                        groupTasks.splice(groupTaskIndex, 1);
                        // Move the group task to the beginning of the array
                        groupTasks.unshift(groupTaskId);
                    }
                    projectServiceImpl.updateGroupTaskIdListInProject(projectId, groupTasks);
                    return msg200({
                        message: 'Ordinal number in group task updated successfully'
                    });
                }
            } else {
                return msg400(GROUP_TASK_NOT_FOUND);
            }
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    async archiveGroupTask(groupTaskId: string): Promise<IResponse | undefined> {
        try {
            if (await groupTaskValidationImpl.checkExistedGroupTaskById(groupTaskId) === true) {
                const groupTask = await groupTaskStore.findOneActiveGroupTaskById(groupTaskId);
                if (groupTask === null) {
                    return msg400(ARCHIVE_GROUP_TASK_FAILED);
                } else {
                    await groupTaskStore.archiveGroupTask(groupTaskId);
                    return msg200({
                        message: 'Group task archive'
                    });
                }
            }
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }
    
    async enableGroupTask(groupTaskId: string): Promise<IResponse | undefined> {
        try {
            if (await groupTaskValidationImpl.checkExistedGroupTaskById(groupTaskId) === true) {
                const groupTask = await groupTaskStore.findOneInactiveGroupTaskById(groupTaskId);
                if (groupTask === null) {
                    return msg400(ENABLE_GROUP_TASK_FAILED);
                } else {
                    await groupTaskStore.enableGroupTask(groupTaskId);
                    return msg200({
                        message: 'Group task enabled'
                    });
                }
            }
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    async findGroupTaskByName(groupTaskTitle: String, userId: String, project: String): Promise<IResponse | undefined> {
        try {
            // List all project
            const userIdInt = parseInt(userId.valueOf());
            const userProjects = await projectStore.findAllProjectsByOwnerId(userIdInt);
            // Find the project that match with request
            const projectIndex = userProjects.findIndex((projectItem) => projectItem.name === project);
            if (projectIndex === -1) {
                return msg400(PROJECT_NOT_FOUND);
            }
            const projectItem = userProjects[projectIndex];
            // List all group task in that project
            const groupTaskIds = projectItem.groupTasks; // List id of group tasks
            const groupTasks = groupTaskIds.map(async (groupTaskId) => {
                return await groupTaskStore.findGroupTaskById(groupTaskId);
            });
            const groupTasksResult = await Promise.all(groupTasks);
            // Find the group task that match with request
            console.log(groupTaskTitle)
            const groupTaskIndex = groupTasksResult.findIndex((groupTaskItem) => {
                let count = 1;
                if (groupTaskItem === null) {
                    return -1;
                }
                if (groupTaskItem.title === groupTaskTitle) {
                    console.log(count);
                    return count;
                }
                count = count + 1;
            });
            if (groupTaskIndex === -1) {
                return msg400(GROUP_TASK_NOT_FOUND);
            }
            const result = groupTasksResult[groupTaskIndex];
            return msg200({
                message: result
            });
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }
}

export const groupTaskService = new GroupTaskService();