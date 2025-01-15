import CacheSingleton from "../../infrastructure/cache/cache-singleton";
import GithubClientAdapter from "../../infrastructure/client/github-client.adapter";
import UserCommitRepository from "../../infrastructure/repository/user-commit.repository";
import { InternalCacheConstants } from "../domain/constants/constants";

class UserCommitService {
    constructor(
        private userCommitRepository: UserCommitRepository = UserCommitRepository.getInstance(),
        private userCommitCache = CacheSingleton.getInstance().getCache(),
        private githubClient = new GithubClientAdapter(),
    ) { }

    async getUserGithubInfo(userId: number): Promise<any> {
        try {
            console.log("Getting user info: " + userId);
            const cachedUserGithubInfo = this.userCommitCache.get(InternalCacheConstants.USER_INFO_CACHE_KEY + userId);
            if (cachedUserGithubInfo) {
                console.log("Returning cached user info");
                return cachedUserGithubInfo;
            }
            console.log("Returning user info from db");
            const userGithubInfo = await this.userCommitRepository.findByUserId(userId);
            console.log("User info: ", userGithubInfo);
            this.userCommitCache.set(InternalCacheConstants.USER_INFO_CACHE_KEY + userId, userGithubInfo);
            return userGithubInfo;
        } catch (error) {
            console.error("Error on getUserGithubInfo: ", error);
            return null;
        }
    }

    async clearUserCache(userId: number): Promise<void> {
        this.userCommitCache.clear(InternalCacheConstants.USER_INFO_CACHE_KEY + userId);
    }

    async verifyGithubAuthorization(code: string, state: string): Promise<any> {
        try {
            console.log("Verifying github authorization");
            const userGithubInfo = await this.userCommitRepository.verifyGithubAuthorization(state);
            if (userGithubInfo === undefined) {
                return null;
            }

            const body = {
                client_id: 'githubClientID',
                client_secret: 'githubClientSecret',
                code: code
            }
            const authorizedGithub = this.githubClient.getGithubAccessToken(body);
            if (authorizedGithub != null) {
                const updatedUser = await this.userCommitRepository.updateUserConsent(userGithubInfo, code, authorizedGithub);
                if (updatedUser === null) {
                    console.log('Something happened when authorized user in Github')
                    return null;
                }
                this.clearUserCache(updatedUser.userId);
                console.log("User info: ", updatedUser);
                return updatedUser;
            }
            return null;
        } catch (error) {
            console.error("Error on verifyGithubAuthorization: ", error);
            return null;
        }
    }
}

export const userCommitService = new UserCommitService();