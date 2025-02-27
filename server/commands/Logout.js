const Command = require(`../utils/Command`);
const supabase = require(`../database/supabase`);

class LogoutCommand extends Command {
    constructor() {
        super({
            name: `logout`,
            aliases: [`signout`],
            params: [],
            requiresAuth: true,
            description: `Logout from current session`
        });
    }

    async beforeExecute(req) {
        if (!supabase.auth.getUser()) {
            throw new Error(`Not authenticated with Supabase`);
        }
        await super.beforeExecute(req);
    }

    async execute(params, req) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true, result: `Successfully logged out`, auth: `logout` };
    }
}

module.exports = LogoutCommand;
