import { ProjectCommitRepository } from "../../infrastructure/repository/project.repository";
import { SyncProjectRepoDto } from "../domain/dtos/github-object.dto";
import { ProjectCommitEntity } from "../domain/entities/project-commit.entity";
import { UserCommitEntity } from "../domain/entities/user-commit.entity";

class ProjectCommitService {
    constructor(
        private projectCommitRepository: ProjectCommitRepository = ProjectCommitRepository.getInstance(),
    ) { }

    async syncProjectRepo(request: SyncProjectRepoDto): Promise<string> {
        try {
            console.log("Syncing project repo: ", request);
            const projectEntity: ProjectCommitEntity = {
                userCommitId: request.userId,
                githubRepo: request.repoName,
                githubRepoUrl: request.repoUrl,
                projectId: request.projectId,
                projectName: request.projectName,
            }
            await this.projectCommitRepository.insert(projectEntity);
            return "Project repo synced";
        } catch (error) {
            console.error("Error on syncProjectRepo: ", error);
            return "Error on syncProjectRepo";
        }
    }

    async getProjectCommits(userId: number): Promise<ProjectCommitEntity[]> {
        try {
            console.log("Getting project commits for user: ", userId);
            return await this.projectCommitRepository.findByCondition("user_commit_id = ?", [userId]);
        } catch (error) {
            console.error("Error on getProjectCommits: ", error);
            return [];
        }
    }

    async deleteProjectCommit(userId: number, projectId: string): Promise<ProjectCommitEntity | undefined> {
        try {
            const projectCommits: ProjectCommitEntity[] = await this.projectCommitRepository.findByCondition("user_commit_id = ? AND project_id = ?", [userId, projectId]);
            const projectCommit: ProjectCommitEntity | undefined = projectCommits[0];
            if (!projectCommit || !projectCommit.id) {
                console.error("Project commit not found for user: ", userId, " and project: ", projectId);
                return undefined;
            }
            console.log("Deleting project commit for user: ", userId, " and project: ", projectId);
            await this.projectCommitRepository.delete(projectCommit.id);
            return projectCommit;
        } catch (error) {
            console.error("Error on deleteProjectCommit: ", error);
            return undefined;
        }
    }
}

export const projectCommitService = new ProjectCommitService();