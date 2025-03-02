const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase`);

class VoteCommand extends Command {
    constructor() {
        super({
            name: `vote`,
            aliases: [`v`],
            params: [`id`],
            requiresAuth: true,
            description: `Vote for a project`,
        });
    }
    async beforeExecute(req) {
        if (!supabase.auth.getUser()) {
            throw new Error(`Not authenticated with Supabase`);
        }
        await super.beforeExecute(req);
    }
    async execute(params, req) {
        const [id] = params;
        const { user } = req;

        if (!id) {
            return { success: false, result: `No project ID provided` };
        }

        const { data: project, error: projectError } = await supabase
            .from(`ysws`)
            .select(`*`)
            .eq(`id`, id)
            .single();

        if (projectError) {
            return { success: false, result: `Project not found` };
        }

        if (project.votedUsers.includes(user.id)) {
            return { success: false, result: `You have already voted for this project` };
        }

        const { error } = await supabase
            .from('ysws')
            .update({ likes: project.likes + 1, votedUsers: [...project.votedUsers, user.id] })
            .eq('id', id)

        if (error) {
            return { success: false, result: error };
        }

        return { success: true, result: `Successfully voted for project` };   
    }
}

module.exports = VoteCommand;