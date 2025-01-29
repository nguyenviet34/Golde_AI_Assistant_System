import { IResponse } from "../common/response";
import { msg200, msg400 } from "../common/response-helpers";
import { commitService } from "../service/commit.service";
import { projectCommitService } from "../service/project-commit.service";
import { userCommitService } from "../service/user-commit.service";

class CommitUsecase {
    constructor(
        public commitServiceImpl = commitService,
        public userCommitServiceImpl = userCommitService,
        public projectCommitServiceImpl = projectCommitService,
    ) { }

    // TODO
    async getUserCommits(userId: number): Promise<IResponse> {
        try {
            const userCommits = this.commitServiceImpl.getUserCommits(userId);
            return msg200({
                userCommits
            })
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    // TODO
    async getProjectCommits(userId: number, projectId: string): Promise<IResponse> {
        try {
            const commits = this.commitServiceImpl.getProjectCommits(userId, projectId);
            return msg200({
                commits
            })
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    // TODO
    async createCommit(data: any): Promise<IResponse> {
        try {
            const commit = this.commitServiceImpl.createCommit(data);
            return msg200({
                commit
            })
        } catch (error: any) {
            return msg400(error.message.toString());
        }
    }

    /**
     * Process to reset synced github commits number 
     * @param data
     * @returns void
     */
    async resetSyncedNumber(data: any): Promise<void> {
        try {
            const projects = await this.projectCommitServiceImpl.getProjectCommitsByTime();
            console.log("Number of projects: ", projects.length);
            for (const project of projects) {
                if (!project.id) {
                    continue;
                }
                await this.projectCommitServiceImpl.resetProjectCommitsSyncedTime(project.id);
            }
        } catch (error: any) {
            console.error("Failed to reset synced number: ", error);
        }
    }

    /**
     * Process to sync github commits
     * 1. Sync all commits for each unsynced project
     * 2. Check if project needs to be synced or not
     * 3. Get all github commits for the user
     * 4. Add github commit to the database
     * 5. Update project commits synced time
     * @param data 
     * @returns void
     */
    async syncGithubCommits(data: any): Promise<void> {
        try {
            console.log("Syncing github commit by project: ", data);
            const projects = await this.projectCommitServiceImpl.getAllProjectCommits();

            for (const project of projects) {
                if (!project.id || !project.userCommitId) {
                    continue;
                }
                const user = await this.userCommitServiceImpl.getUserGithubInfo(project.userCommitId);
                const syncedProjectCommitTime = await this.commitServiceImpl.syncGithubCommit(user, project);
                if (syncedProjectCommitTime !== null) {
                    await this.projectCommitServiceImpl.updateProjectCommitSynced(
                        project.id, project.userNumberSynced, syncedProjectCommitTime, true);
                }
            }
        } catch (error: any) {
            console.error("Failed to sync github commit by project: ", error);
        }
    }
}

export const commitUsecase = new CommitUsecase();