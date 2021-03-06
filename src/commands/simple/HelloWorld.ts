import { MappedParameter } from "@atomist/automation-client/decorators";
import {
    CommandHandler,
    HandleCommand,
    HandlerContext,
    HandlerResult, MappedParameters,
    Parameter,
    Tags,
} from "@atomist/automation-client/Handlers";
import { logger } from "@atomist/automation-client/internal/util/logger";
import * as _ from "lodash";
import * as graphql from "../../typings/types";

@CommandHandler("Sends a hello back to the invoking user/channel", "hello world")
@Tags("hello")
export class HelloWorld implements HandleCommand {

    @Parameter({ pattern: /^.*$/ })
    public name: string;

    @MappedParameter(MappedParameters.SLACK_USER_NAME)
    public slackUser: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        logger.info(`Incoming parameter was ${this.name}`);

        return ctx.graphClient.executeFile<graphql.Person.Query, graphql.Person.Variables>("person",
            { teamId: ctx.teamId, slackUser: this.slackUser })
            .then(result => {
                if (_.get(result, "ChatTeam[0].members[0].person")) {
                    return result.ChatTeam[0].members[0].person;
                } else {
                    return null;
                }
            })
            .then(person => {
                if (person) {
                    return ctx.messageClient.respond(`Hello ${this.name} from ${person.forename} ${person.surname}`);
                } else {
                    return ctx.messageClient.respond(`Hello ${this.name}`);
                }
            })
            .then(() => {
                return { code: 0 };
            });
    }
}
