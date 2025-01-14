import { ulid } from "ulid";
import { UserCommitEntity } from "../../core/domain/entities/user-commit.entity";
import Repository from "../database/repository";

export class UserCommitRepository extends Repository {
    private static instance: UserCommitRepository;

    public static getInstance(): UserCommitRepository {
        if (!UserCommitRepository.instance) {
            UserCommitRepository.instance = new UserCommitRepository();
        }
        return UserCommitRepository.instance;
    }

    constructor() {
        super('user_commit');
    }

    async findByUserId(userId: number): Promise<UserCommitEntity> {
        const users = await this.findByCondition('user_id = ?', [userId]);
        let user = users[0];
        const state = ulid(); 

        if (!user) {
            user = {
                userId: Number(userId),
                githubUrl: '',
                githubSha: '',
                userConsent: false,
                userState: state,
            };
            const insertId = await this.insert(user);
            user.id = insertId; 
        } else {
            await this.update(user.id, { userState: state });
            user.userState = state; 
        }

        const {githubSha, ...result } = user;
        return result;
    }

    async verifyGithubAuthorization(code: string, state: string): Promise<UserCommitEntity> {
        const users = await this.findByCondition('user_state = ?', [state]);
        const user = users[0];
        if (!user) {
            throw new Error('User not found');
        }
        await this.update(user.id, { userConsent: true, githubSha: code });
        console.log('User consented');
        // const githubInfo = await this.getGithubInfo(code);
        // await this.update(user.id, { githubUrl: githubInfo.html_url, githubSha: githubInfo.sha });
        // user.githubUrl = githubInfo.html_url;
        // user.githubSha = githubInfo.sha;

        return user;
    }
}

export default UserCommitRepository;