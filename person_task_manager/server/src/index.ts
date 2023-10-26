import express, { Application, NextFunction, Request, Response } from "express";
import { config, validateEnvironmentVars } from "./config/configuration";
import { MongoHelper } from "./database/mongodb.db";
import { taskRouter } from "./modules/person_task_manager/controllers/task.controller";
import { groupTaskRouter } from "./modules/person_task_manager/controllers/group-task.controller";
import { authRouter } from "./modules/user_authentication/auth.controller";
import { projectRouter } from "./modules/person_task_manager/controllers/project.controller";
import { subTaskRouter } from "./modules/person_task_manager/controllers/sub-task.controller";
import { commentRouter } from "./modules/person_task_manager/controllers/comment.controller";

async function main(): Promise<void> {
    validateEnvironmentVars()

    const mongoHelper = new MongoHelper(
        config.database.host,
        config.database.port,
        config.database.name,
        config.database.username,
        config.database.password,
    )
    await mongoHelper.connect();
    console.log("Connected to MongoDB");

    const app: Application = express();
    const port = process.env.PORT || 3000;

    app.use("/auth", authRouter)
    app.use("/project", projectRouter);
    app.use("/group-task", groupTaskRouter);
    app.use("/task", taskRouter);
    app.use("/sub-task", subTaskRouter);
    app.use("/comment", commentRouter);

    app.use((req: Request, res: Response, next: NextFunction) => next(new Error("Not Found")))

    app.listen(config.server.listenPort, () => {
        console.log(`Server running on port ${port}`);
    });

}

main();